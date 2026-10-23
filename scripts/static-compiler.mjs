// Compiler distribution uses free Static Assets, not metered object storage.
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { pathToFileURL } from "node:url";
import { prepareCompilerSupport } from "./compiler-support.mjs";

const required = [
  "busytex.js", "busytex.wasm", "busytex_worker.js", "busytex_pipeline.js",
  "busytex_biber.js", "texlive-extra.js", "texlive-extra.data",
  "biber.js", "biber.wasm", "biber.data",
  "revtex-4.2f.json", "revtex-4.2f.zip",
];
const partSize = 20 * 1024 * 1024; // Below Cloudflare's 25 MiB per-asset limit.
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

// Serialized into the pinned upstream JS at build time. Only the transport changes;
// the WebAssembly and TeX data bytes delivered to the compiler stay identical.
export function compilerFetch(manifest, nativeFetch, base) {
  return async function (input, init) {
    const url = new URL(typeof input === "string" ? input : input.url, base);
    const name = url.pathname.split("/").pop();
    const entry = manifest[name];
    if (!entry) return nativeFetch(input, init);
    let index = 0, reader, received = 0;
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          while (true) {
            if (!reader) {
              if (index === entry.parts.length) {
                if (received !== entry.size) throw Error("Incomplete compiler download: " + name);
                controller.close();
                return;
              }
              const part = entry.parts[index++];
              const response = await nativeFetch(new URL(part, url).href, init);
              if (!response.ok || !response.body)
                throw Error("Compiler download failed (" + response.status + "): " + part);
              reader = response.body.pipeThrough(new DecompressionStream("gzip")).getReader();
            }
            const { done, value } = await reader.read();
            if (done) { reader.releaseLock(); reader = undefined; continue; }
            received += value.length;
            if (received > entry.size) throw Error("Invalid compiler download: " + name);
            controller.enqueue(value);
            return;
          }
        } catch (error) { controller.error(error); }
      },
      async cancel(reason) { await reader?.cancel(reason); },
    });
    return new Response(stream, { headers: {
      "Content-Type": name.endsWith(".wasm") ? "application/wasm" : "application/octet-stream",
      "Content-Length": String(entry.size),
    } });
  };
}

export async function prepareStaticCompiler(target = "dist/compiler/1.4.1-static2") {
  await prepareCompilerSupport();
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  const manifest = {};
  for (const name of required.filter((name) => !name.endsWith(".js"))) {
    const bytes = await readFile("public/compiler/" + name);
    if (bytes.length <= partSize) {
      await writeFile(target + "/" + name, bytes);
      continue;
    }
    const parts = [];
    for (let offset = 0; offset < bytes.length; offset += partSize) {
      const compressed = gzipSync(bytes.subarray(offset, offset + partSize), { level: 6 });
      const part = name + "." + parts.length + "." + hash(compressed).slice(0, 16) + ".gz";
      if (compressed.length >= 25 * 1024 * 1024) throw Error("Compiler part exceeds asset limit");
      await writeFile(target + "/" + part, compressed);
      parts.push(part);
    }
    manifest[name] = { size: bytes.length, sha256: hash(bytes), parts };
  }
  const helper = "\n// AgentsLaTeX static download adapter; source: scripts/static-compiler.mjs\n" +
    "var agentslatexAssetFetch = (" + compilerFetch.toString() + ")(" +
    JSON.stringify(manifest) + ", globalThis.fetch.bind(globalThis), globalThis.location.href);\n";
  for (const name of required.filter((name) => name.endsWith(".js"))) {
    const original = await readFile("public/compiler/" + name, "utf8");
    const patched = original.replace(/(?<![\w.$])fetch\s*\(/g, "agentslatexAssetFetch(");
    await writeFile(target + "/" + name, patched === original ? original : helper + patched);
  }
  await writeFile(target + "/manifest.json", JSON.stringify(manifest, null, 2) + "\n");
  console.log("Compiler packaged as static assets; no R2 bucket or subscription required.");
  return manifest;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await prepareStaticCompiler();
