// Small, reproducible additions to the pinned BusyTeX 1.4.1 runtime.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { unzipSync, strFromU8 } from "fflate";

/** Read only artifacts produced by the selected document's first TeX pass. */
export function bibliographyFromAux(read, auxPath, bibtex = null, biber = null) {
  const visited = new Set();
  const hasBibdata = path => {
    if (visited.has(path)) return false;
    visited.add(path);
    const text = read(path);
    return /\\bibdata\s*\{/.test(text) ||
      [...text.matchAll(/\\@input\s*\{([^}]+)\}/g)].some(match => hasBibdata(match[1]));
  };
  const useBiber = biber ?? /<bcf:controlfile\b/.test(read(auxPath.replace(/\.aux$/, ".bcf")));
  return { bibtex: useBiber || (bibtex ?? hasBibdata(auxPath)), backend: useBiber ? "biber" : "bibtex8" };
}

const marker = "// AgentsLaTeX compiler fixes v1 (BusyTeX 1.4.1)";
export function patchPipeline(source) {
  if (source.includes(marker)) return source;
  const replace = (before, after) => {
    if (source.split(before).length !== 2) throw Error("BusyTeX 1.4.1 patch no longer matches; inspect the upstream change.");
    source = source.replace(before, after);
  };
  replace("        if (bibtex === null)\n            bibtex = this.bibtex_resolver.resolve(files);\n\n        const bib_backend = biber === null ? this.bibtex_resolver.resolve_backend(files) : (biber ? 'biber' : 'bibtex8');",
    "        let bib_backend = biber ? 'biber' : 'bibtex8';");
  replace("        const effective_exit_code = stdout.trim() ? (error_messages.some(err => stdout.includes(err)) ? exit_code : 0) : exit_code;",
    "        const fatal = error_messages.some(err => (stdout + '\\n' + stderr + '\\n' + log).includes(err));\n        const effective_exit_code = fatal ? (exit_code || 1) : (stdout.trim() ? 0 : exit_code);");
  replace("        if (exit_code == 0 && bibtex) {", `        if (exit_code == 0) {
            const required = agentslatexBibliography(path => this.read_all_text(FS, path), aux_path, bibtex, biber);
            bibtex = required.bibtex;
            bib_backend = required.backend;
        }

        if (exit_code == 0 && bibtex) {`);
  return marker + "\nconst agentslatexBibliography = " + bibliographyFromAux.toString() + ";\n" + source;
}

// mirrors.ctan.org redirects to a different mirror on every request, and not every mirror
// completes a TLS handshake with Node. The checksum below is what guarantees the bytes.
const revtexMirrors = [
  "https://mirrors.ctan.org",
  "https://ctan.math.utah.edu/ctan/tex-archive",
  "https://mirrors.rit.edu/CTAN",
];
async function downloadRevtex() {
  const failures = [];
  for (const mirror of revtexMirrors) {
    try {
      const response = await fetch(mirror + "/install/macros/latex/contrib/revtex.tds.zip");
      if (!response.ok) throw Error("HTTP " + response.status);
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) { failures.push(mirror + ": " + (error.cause?.message ?? error.message)); }
  }
  throw Error("REVTeX download failed from every mirror:\n" + failures.join("\n"));
}

export async function prepareCompilerSupport() {
  const folder = "public/compiler";
  const pipeline = folder + "/busytex_pipeline.js";
  const original = await readFile(pipeline, "utf8").catch(error => {
    throw error.code === "ENOENT" ? Error("Compiler assets are not installed; run pnpm setup first.") : error;
  });
  const patched = patchPipeline(original);
  if (patched !== original) await writeFile(pipeline, patched);

  // Keep the complete, unmodified upstream distribution available, including sources/license.
  const archivePath = folder + "/revtex-4.2f.zip";
  let archive;
  try { archive = await readFile(archivePath); }
  catch (error) {
    if (error.code !== "ENOENT") throw error;
    archive = await downloadRevtex();
  }
  if (createHash("sha256").update(archive).digest("hex") !== "594346d851a4a8f73de31235b83cbb105bf7730cc4b8eca23c3c87f159a48400")
    throw Error("REVTeX archive checksum mismatch; no package installed.");
  const files = unzipSync(archive, { filter: file => /^(tex\/latex|bibtex\/bst)\/revtex\/[^/]+\.(cls|rtx|sty|bst)$/.test(file.name) });
  const runtime = Object.fromEntries(Object.entries(files).map(([path, data]) => [path.split("/").pop(), strFromU8(data)]));
  if (!runtime["revtex4-2.cls"] || !runtime["apsrev4-2.bst"]) throw Error("Incomplete REVTeX distribution");
  await mkdir(folder, { recursive: true });
  await writeFile(archivePath, archive);
  await writeFile(folder + "/revtex-4.2f.json", JSON.stringify(runtime));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await prepareCompilerSupport();
