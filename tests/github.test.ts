import { test } from "node:test";
import assert from "node:assert/strict";
import { commitFiles } from "../worker/github";
import { safePath, newProject, type Repo } from "../shared/contracts";
import { agentRanges } from "../shared/tagging";
import { conflictingPaths } from "../src/merge";
import { templateFiles } from "../shared/template";
import worker from "../worker/index";
import type { Bindings } from "../worker/auth";
const repo = { full_name: "person/paper" } as Repo;
test("project names normalize spaces consistently before creation and retries", () => {
  const requestId = "00000000-0000-4000-8000-000000000001";
  const name = "  My   research paper  ";
  const parsed = newProject.parse({ name, requestId });
  assert.equal(parsed.name, "My-research-paper");
  assert.deepEqual(newProject.parse({ name: parsed.name, requestId }), parsed);
  assert.equal(newProject.safeParse({ name: "../paper", requestId }).success, false);
});
const base = "a".repeat(40),
  other = "b".repeat(40),
  next = "c".repeat(40);
test("save never writes when the remote base has advanced", async () => {
  const original = globalThis.fetch;
  const calls: string[] = [];
  globalThis.fetch = async (input, init) => {
    calls.push(String(input));
    assert.equal(init?.method, "GET");
    return Response.json({ object: { sha: other } });
  };
  try {
    await assert.rejects(
      commitFiles(
        "token",
        repo,
        "main",
        base,
        [{ path: "agentlatex/main.tex", sha: next }],
        "Edit",
      ),
      /newer changes/,
    );
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = original;
  }
});
test("save uses the exact parent and refuses a racing ref update", async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (input, init) => {
    calls++;
    const p = String(input);
    if (p.includes("/git/ref/"))
      return Response.json({ object: { sha: base } });
    if (p.endsWith("/git/commits/" + base))
      return Response.json({ tree: { sha: base } });
    if (p.endsWith("/git/trees")) return Response.json({ sha: next });
    if (p.endsWith("/git/commits")) {
      assert.deepEqual(JSON.parse(String(init?.body)).parents, [base]);
      return Response.json({ sha: next });
    }
    if (p.includes("/git/refs/")) {
      assert.equal(JSON.parse(String(init?.body)).force, false);
      return Response.json({ message: "Not a fast forward" }, { status: 422 });
    }
    throw Error(p);
  };
  try {
    await assert.rejects(
      commitFiles(
        "token",
        repo,
        "main",
        base,
        [{ path: "agentlatex/main.tex", sha: next }],
        "Edit",
      ),
      /changed while saving/,
    );
    assert.equal(calls, 5);
  } finally {
    globalThis.fetch = original;
  }
});
test("unchanged remote files preserve local edits; only overlapping changes conflict", () => {
  const entry = (path: string, sha: string) => ({
    path,
    sha,
    size: 1,
    mode: "100644",
    type: "blob",
  });
  assert.deepEqual(
    conflictingPaths(
      [entry("a", base), entry("b", base)],
      [entry("a", base), entry("b", other)],
      ["a", "b", "new"],
    ),
    ["b"],
  );
});
test("template contains a working main, shared instructions and valid Agent markers", () => {
  const files = templateFiles();
  assert.ok(files["agentlatex/main.tex"].includes("\\documentclass"));
  assert.equal(files["CLAUDE.md"], "@AGENTS.md\n");
  assert.ok(files["AGENTS.md"].includes("Every manuscript passage"));
  assert.ok(files["agentlatex/AGENTS.md"].includes("every"));
  assert.deepEqual(agentRanges(files["agentlatex/main.tex"]).errors, []);
  assert.equal(agentRanges(files["agentlatex/main.tex"]).ranges.length, 1);
  assert.equal(JSON.parse(files[".agentlatex.json"]).main, "agentlatex/main.tex");
});
test("tag errors are explicit and unmarked text has no Agent range", () => {
  assert.deepEqual(agentRanges("Manual prose").ranges, []);
  assert.ok(agentRanges("% agentlatex:begin agent id=a\nText").errors.length);
  assert.ok(agentRanges("% agentlatex:end id=b").errors.length);
});
test("reject traversal and absolute paths", () => {
  for (const p of [
    "../secret",
    "/main.tex",
    ".git/config",
    "paper/../../x",
    "a\\b",
  ])
    assert.equal(safePath.safeParse(p).success, false);
  assert.equal(safePath.safeParse("paper/figures/a.png").success, true);
});
test("private APIs require login; cross-origin writes are refused before processing", async () => {
  const env = {} as Bindings;
  let r = await worker.fetch(
    new Request("https://agentlatex.com/api/projects"),
    env,
  );
  assert.equal(r.status, 401);
  assert.equal(r.headers.get("Cache-Control"), "no-store");
  r = await worker.fetch(
    new Request("https://agentlatex.com/api/projects", {
      method: "POST",
      headers: { Origin: "https://elsewhere.example" },
    }),
    env,
  );
  assert.equal(r.status, 403);
});

test("expired sign-in returns to a usable Connect screen", async () => {
  const r = await worker.fetch(
    new Request("https://agentlatex.com/api/auth/callback?code=expired"),
    { APP_ORIGIN: "https://agentlatex.com" } as Bindings,
  );
  assert.equal(r.status, 302);
  assert.equal(
    r.headers.get("Location"),
    "https://agentlatex.com/?signin=retry",
  );
});
