import { test } from "node:test";
import assert from "node:assert/strict";
import { buildFailurePrompt } from "../src/build-prompt";
import type { Project } from "../shared/contracts";

test("failure handoff retains the complete log and identifies the failing draft", () => {
  const log = "! Missing \\begin{document}.\n" + "Diagnostic details\n".repeat(1000) + "FINAL ERROR";
  const project = { url: "https://github.com/test/paper", branch: "main" } as Project;
  const prompt = buildFailurePrompt(project, "paper/chapter.tex", "xe", "a".repeat(40), true, log);
  assert.ok(prompt.includes(log));
  assert.ok(prompt.includes("Document compiled: paper/chapter.tex"));
  assert.ok(prompt.includes("XeLaTeX"));
  assert.ok(prompt.includes("unsaved browser draft"));
  assert.ok(!buildFailurePrompt(project, "paper/main.tex", "pdf", "b".repeat(40), false, log).includes("included an unsaved"));
});
