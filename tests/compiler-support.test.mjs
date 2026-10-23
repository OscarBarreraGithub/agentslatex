import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { bibliographyFromAux, patchPipeline } from "../scripts/compiler-support.mjs";

const select = (files, bibtex = null, biber = null) =>
  bibliographyFromAux(path => files[path] ?? "", "main.aux", bibtex, biber);
test("only the selected build's artifacts determine bibliography tools", () => {
  assert.deepEqual(select({ "main.aux": "\\citation{manual}", "archive.tex": "\\bibliography{refs}", "main.tex": "% \\bibliography{refs}", "paper.bbl": "\\begin{thebibliography}{1}" }), { bibtex: false, backend: "bibtex8" });
  assert.deepEqual(select({ "main.aux": "\\bibdata{refs}" }), { bibtex: true, backend: "bibtex8" });
  assert.deepEqual(select({ "main.bcf": '<bcf:controlfile version="3.11">' }), { bibtex: true, backend: "biber" });
});
test("included auxiliary files work, cycles terminate, and explicit overrides survive", () => {
  const files = { "main.aux": "\\@input{sections/one.aux}", "sections/one.aux": "\\@input{main.aux}\n\\bibdata{refs}" };
  assert.equal(select(files).bibtex, true);
  assert.equal(select(files, false).bibtex, false);
  assert.equal(select({}, true).bibtex, true);
  assert.deepEqual(select({}, false, true), { bibtex: true, backend: "biber" });
  assert.deepEqual(select({ "main.bcf": "<bcf:controlfile>" }, null, false), { bibtex: false, backend: "bibtex8" });
  assert.equal(select({ "main.aux": "\\@input{main.aux}" }).bibtex, false);
});
test("pinned runtime stops on fatal output even when WASM reports exit zero", async () => {
  const patched = patchPipeline(await readFile("public/compiler/busytex_pipeline.js", "utf8"));
  assert.equal(patchPipeline(patched), patched);
  const start = patched.indexOf("    _run_cmd(");
  const end = patched.indexOf("    async read_project_files(", start);
  const method = vm.runInNewContext("({" + patched.slice(start, end) + "})", { BusytexPipeline: { VerboseSilent: "silent", VerboseInfo: "info", VerboseDebug: "debug" } })._run_cmd;
  for (const channel of ["stdout", "stderr", "log"]) {
    const fatal = "! LaTeX Error: File `missing.cls' not found.\nFatal error occurred, no output PDF file produced!";
    const owner = { remove() {}, print() {}, read_all_text: (_fs, path) => channel === "log" && path === "main.log" ? fatal : "" };
    const module = { callMainWithRedirects: () => ({ exit_code: 0, stdout: channel === "stdout" ? fatal : "TeX", stderr: channel === "stderr" ? fatal : "" }), HEAPU8: new Uint8Array(1) };
    const logs = [];
    const result = method.call(owner, module, {}, ["pdflatex", "main.tex"], ["Fatal error occurred"], "info", "main.log", "main.blg", "main.aux", "main.bbl", new Uint8Array(1), logs);
    assert.equal(result.exit_code, 1, channel);
    assert.equal(logs[0].exit_code, 1, channel);
  }
});
