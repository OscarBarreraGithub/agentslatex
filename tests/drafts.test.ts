import { test } from "node:test";
import assert from "node:assert/strict";
import { cachedDraftFiles, type ProjectDraft } from "../src/drafts";
import type { Entry } from "../shared/contracts";

test("reopening reuses unchanged saved bytes but never stale or unsaved bytes", () => {
  const entry = (path: string, sha: string): Entry => ({ path, sha, size: 1, type: "blob", mode: "100644" });
  const saved: ProjectDraft = {
    revision: "old", entries: [entry("same.tex", "a"), entry("changed.tex", "b"), entry("deleted.tex", "c")],
    files: ["same.tex", "changed.tex", "deleted.tex"].map(path => ({ path, content: path })),
    dirty: [], selected: "same.tex", main: "same.tex", engine: "pdf",
  };
  const remote = [entry("same.tex", "a"), entry("changed.tex", "new")];
  assert.deepEqual(cachedDraftFiles(saved, remote).map(file => file.path), ["same.tex"]);
  assert.deepEqual(cachedDraftFiles({ ...saved, dirty: ["same.tex"] }, remote), []);
  assert.deepEqual(cachedDraftFiles(undefined, remote), []);
});
