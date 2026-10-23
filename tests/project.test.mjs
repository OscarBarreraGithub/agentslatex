import test from "node:test";
import assert from "node:assert/strict";
import { inferMain, isTextFile } from "../src/project.mjs";
test("the document root wins over an included TeX file", () => {
  assert.equal(
    inferMain([
      { path: "chapter.tex", content: "Text" },
      { path: "paper.tex", content: "\\documentclass{article}" },
    ]),
    "paper.tex",
  );
  assert.equal(inferMain([{ path: "figures/plot.png", content: new Uint8Array() }]), "");
});
test("editable text types are recognised by extension, case-insensitively", () => {
  for (const path of ["main.tex", "refs.BIB", "local.sty", "data/values.csv"]) assert.ok(isTextFile(path), path);
  for (const path of ["figures/plot.png", "main.pdf", "draft"]) assert.ok(!isTextFile(path), path);
});
