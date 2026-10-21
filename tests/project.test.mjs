import test from "node:test";
import assert from "node:assert/strict";
import { normalizePath, validateFiles, inferMain } from "../src/project.mjs";
test("folder imports retain nested paths and support Windows separators", () => {
  assert.equal(normalizePath("figures\\plot.png"), "figures/plot.png");
  assert.equal(normalizePath("chapter one/text.tex"), "chapter one/text.tex");
});
test("unsafe paths and colliding imports are rejected before compilation", () => {
  for (const path of [
    "../secret",
    "/secret",
    "C:\\secret",
    "a/../../secret",
    "a\0.tex",
  ])
    assert.throws(() => normalizePath(path));
  assert.throws(() =>
    validateFiles([
      { path: "main.tex", content: "" },
      { path: "main.tex", content: "" },
    ]),
  );
});
test("the document root wins over an included TeX file", () => {
  assert.equal(
    inferMain([
      { path: "chapter.tex", content: "Text" },
      { path: "paper.tex", content: "\\documentclass{article}" },
    ]),
    "paper.tex",
  );
});
