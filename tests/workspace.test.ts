import { test } from "node:test";
import assert from "node:assert/strict";
import { workspaceConfig, workspacePaths, fileDestination, renamedPath, missingExtension, unlinkReference, joinFolder } from "../shared/workspace";
import { fileContent } from "../src/file-content";
import { renderMarkdown } from "../src/markdown";
import { templateFiles } from "../shared/template";

test("legacy folders survive while default document and main folder are independent", () => {
  const legacy = workspaceConfig({ version: 1, main: "paper/manuscript.tex" }, "paper/main.tex");
  assert.equal(legacy.folder, "paper");
  assert.equal(legacy.main, "paper/manuscript.tex");
  const defaulted = workspaceConfig({ version: 1, folder: "research" }, "old/main.tex");
  assert.equal(defaulted.main, "research/main.tex");
  assert.equal(workspaceConfig({ version: 1, folder: "" }, "paper/main.tex").main, "main.tex");
});
test("workspace links retain original paths and file moves reject collisions", () => {
  const paths = ["paper/main.tex", "paper/chapter.tex", "paper/sub/chapter.tex", "shared/figure.png", "private/unrelated.csv"];
  assert.deepEqual(workspacePaths(paths, "paper", ["shared/figure.png"]), paths.slice(0, 4));
  assert.throws(() => fileDestination("paper/chapter.tex", "paper/sub", paths), /already contains/);
  assert.equal(fileDestination("paper/main.tex", "paper/sub", paths), "paper/sub/main.tex");
  assert.throws(() => fileDestination("paper/main.tex", "../secret", paths));
});
test("new and connected-folder starters use portable relative compile paths", () => {
  const files = templateFiles();
  assert.equal(JSON.parse(files[".agentlatex.json"]).folder, "agentlatex");
  assert.ok(files["agentlatex/main.tex"].includes("\\graphicspath{{figures/}}"));
  const nested = templateFiles("research/paper");
  assert.ok(nested["research/paper/main.tex"].includes("\\graphicspath{{figures/}}"));
  assert.ok(!("research/paper/AGENTS.md" in nested));
  assert.ok(templateFiles("")["AGENTS.md"].includes("% agent:begin"));
});
test("Markdown renders normal structure without raw HTML, executable links or image requests", () => {
  const html = renderMarkdown('# Notes\n\n**Result**\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n![secret](https://example.com/pixel)\n\n[Source](https://example.com/paper)');
  assert.ok(html.includes('<h1>Notes</h1>'));
  assert.ok(html.includes('<strong>Result</strong>'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
});
test("forgotten extensions can be renamed without overwriting a file or folder", () => {
  const paths = ["paper/draft", "paper/main.tex", "paper/figures/a.png"];
  assert.equal(renamedPath("paper/draft", "draft.tex", paths), "paper/draft.tex");
  for (const name of ["main.tex", "figures", "../draft.tex", "sub/draft.tex", ""]) {
    assert.throws(() => renamedPath("paper/draft", name, paths));
  }
  assert.equal(missingExtension("paper/draft"), true);
  assert.equal(missingExtension("paper/draft.tex"), false);
  const text = new TextEncoder().encode("A draft without an extension.");
  assert.equal(fileContent("paper/draft", text), "A draft without an extension.");
  assert.equal(fileContent("paper/draft.tex", text), "A draft without an extension.");
  const binary = new Uint8Array([0, 255, 13]);
  assert.equal(fileContent("paper/draft", binary), binary);
});
test("unlinking removes only the reference, retaining other links and original paths", () => {
  const paths = ["paper/main.tex", "shared/a.tex", "shared/b.tex"];
  assert.deepEqual(unlinkReference("shared/a.tex", ["shared/a.tex", "shared/b.tex"], paths), ["shared/b.tex"]);
  assert.deepEqual(unlinkReference("shared/a.tex", ["shared"], paths), ["shared/b.tex"]);
  assert.deepEqual(paths, ["paper/main.tex", "shared/a.tex", "shared/b.tex"]);
});
test("invalid names explain themselves instead of exposing a schema issue list", () => {
  for (const name of ["..", "a\u0000b", ".git"]) {
    assert.throws(() => joinFolder("paper", name), e => e instanceof Error && !e.message.includes("[") && /plain project-relative name/.test(e.message));
    assert.throws(() => renamedPath("paper/draft", name, ["paper/draft"]), e => e instanceof Error && !e.message.includes("["));
  }
  assert.equal(joinFolder("", "main.tex"), "main.tex");
});
test("Latin-1 manuscripts keep their characters instead of becoming replacement marks", () => {
  const latin1 = new Uint8Array([0x63, 0x61, 0x66, 0xe9]); // "café" in ISO-8859-1
  assert.equal(fileContent("paper/old.tex", latin1), "café");
  const utf8 = new TextEncoder().encode("naïve — ok");
  assert.equal(fileContent("paper/new.tex", utf8), "naïve — ok");
  assert.equal(fileContent("paper/new.bib", utf8), "naïve — ok");
  const binary = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 1]);
  assert.equal(fileContent("figures/plot.png", binary), binary);
});
