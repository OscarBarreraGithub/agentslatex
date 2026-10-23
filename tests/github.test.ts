import { test } from "node:test";
import assert from "node:assert/strict";
import { commitFiles, github, ApiError } from "../worker/github";
import { safePath, newProject, saveProject, type Repo } from "../shared/contracts";
import { agentRanges } from "../shared/tagging";
import { conflictingPaths } from "../src/merge";
import { templateFiles } from "../shared/template";
import { readFileSync } from "node:fs";
import { connectInstructions, appendInstructions } from "../shared/instructions";
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
  assert.ok(files["agentlatex/main/main.tex"].includes("\\documentclass"));
  assert.ok(!Object.keys(files).some(path => path.endsWith("CLAUDE.md")));
  assert.ok(!files["IMPORTS.md"]);
  assert.ok(!files["skills/agentslatex-import-conversation/SKILL.md"]);
  assert.ok(!files["latex-specs.md"]);
  assert.ok(!files["skills/GitHub-setup.md"]);
  assert.ok(files["AGENTS.md"].includes("https://agentlatex.com/docs/AGENTS.md"));
  assert.ok(files["agentlatex/main/AGENTS.md"].includes("every"));
  assert.ok(files["agentlatex/main/AGENTS.md"].startsWith("% Add your LaTeX-specific instructions for agents here.\n\n"));
  assert.ok(files["AGENTS.md"].startsWith("% Add your LaTeX-specific instructions for agents here.\n\n"));
  assert.deepEqual(agentRanges(files["agentlatex/main/main.tex"]).errors, []);
  assert.equal(agentRanges(files["agentlatex/main/main.tex"]).ranges.length, 0);
  assert.ok(!files["agentlatex/main/main.tex"].includes("agentlatex:author"));
  assert.ok(files["AGENTS.md"].includes("% agent:begin"));
  assert.equal(JSON.parse(files[".agentlatex.json"]).main, "agentlatex/main/main.tex");
});
test("connecting preserves existing root/nested instructions and appends live pointers only once", async () => {
  const files: Record<string, string> = {
    "agents.md": "# Owner rules\nUse the existing research workflow.\n",
    "research/paper/AGENTS.md": "# Paper preferences\nPreserve notation.\n",
    "research/paper/main.tex": "Existing manuscript",
  };
  const original = { ...files };
  const changes = await connectInstructions(Object.keys(files), "research/paper", async path => files[path]);
  assert.deepEqual(Object.keys(changes), ["agents.md", "research/paper/AGENTS.md"]);
  for (const [path, content] of Object.entries(changes)) {
    assert.ok(content.startsWith(original[path]));
    assert.ok(content.includes("https://agentlatex.com/docs/latex-specs.md"));
  }
  Object.assign(files, changes);
  assert.deepEqual(await connectInstructions(Object.keys(files), "research/paper", async path => files[path]), {});
  assert.equal(files["research/paper/main.tex"], original["research/paper/main.tex"]);
  assert.deepEqual(Object.keys(await connectInstructions([], "", async () => { throw Error("Unexpected read"); })), ["AGENTS.md"]);
  await assert.rejects(connectInstructions(["AGENTS.md"], "paper", async () => { throw Error("read failed"); }), /read failed/);
});
test("tag errors are explicit and unmarked text has no Agent range", () => {
  assert.deepEqual(agentRanges("Manual prose").ranges, []);
  assert.ok(agentRanges("% agentlatex:begin agent id=a\nText").errors.length);
  assert.ok(agentRanges("% agentlatex:end id=b").errors.length);
});
test("simple passage tags highlight only agent text and retain old paper compatibility", () => {
  const text = "Manual\n% agent:begin\nFirst\n% agent:end\nManual again\n% agent:begin\nSecond\n% agent:end";
  const result = agentRanges(text);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.ranges.map(r => text.slice(r.from, r.to)), ["First", "Second"]);
  const old = "% agentlatex:begin agent id=old\nEarlier passage\n% agentlatex:end id=old";
  assert.deepEqual(agentRanges(old).errors, []);
  assert.equal(agentRanges(old).ranges.length, 1);
  for (const invalid of ["% agent:begin\nUnclosed", "% agent:end", "% agent:begin\n% agent:begin\nNested\n% agent:end", "% agent:begin\nMixed\n% agentlatex:end id=old"])
    assert.ok(agentRanges(invalid).errors.length, invalid);
});
test("refreshing old managed instructions preserves user preferences and surrounding text", () => {
  const before = "# My preferences\nUse my notation.\n";
  const after = "\n# Other rules\nKeep all figures.\n";
  const old = before + "<!-- agentlatex:instructions -->\nOld model metadata rule\n<!-- /agentlatex:instructions -->" + after;
  const updated = appendInstructions(old);
  assert.ok(updated.startsWith(before)); assert.ok(updated.endsWith(after));
  assert.ok(updated.includes("% agent:begin")); assert.ok(!updated.includes("Old model metadata rule"));
  assert.equal(appendInstructions(updated), updated);
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

 test("published canonical reminder is reused without duplicate application reminders", () => {
  const lines = JSON.parse(readFileSync(new URL("../shared/project-reminder.json", import.meta.url), "utf8")) as string[];
  const canonical = lines.join("\n");
  const local = "# Existing preferences\n" + canonical;
  assert.equal(appendInstructions(local), local);
  assert.ok(appendInstructions().includes(canonical));
});
test("GitHub outages with non-JSON bodies and timeouts surface as temporary failures", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("<html>Bad gateway</html>", { status: 502, headers: { "Content-Type": "text/html" } });
    await assert.rejects(github("token", "/user"), e => e instanceof ApiError && e.status === 503);
    globalThis.fetch = async () => { throw new DOMException("The operation timed out.", "TimeoutError"); };
    await assert.rejects(github("token", "/user"), e => e instanceof ApiError && e.status === 503 && e.retryAfterSeconds > 0);
    globalThis.fetch = async () => { throw new TypeError("fetch failed"); };
    await assert.rejects(github("token", "/user"), e => e instanceof ApiError && e.status === 503);
  } finally {
    globalThis.fetch = original;
  }
});
test("branches containing slashes keep a valid ref path and saves keep an executable file's mode", async () => {
  const original = globalThis.fetch;
  const urls: string[] = [];
  let tree: { path: string; mode: string }[] = [];
  globalThis.fetch = async (input, init) => {
    const p = String(input);
    urls.push(p);
    if (p.includes("/git/ref/")) return Response.json({ object: { sha: base } });
    if (p.endsWith("/git/commits/" + base)) return Response.json({ tree: { sha: base } });
    if (p.endsWith("/git/trees")) { tree = JSON.parse(String(init?.body)).tree; return Response.json({ sha: next }); }
    if (p.endsWith("/git/commits")) return Response.json({ sha: next });
    if (p.includes("/git/refs/")) return Response.json({});
    throw Error(p);
  };
  try {
    const revision = await commitFiles("token", repo, "release/1.0", base,
      [{ path: "scripts/build.sh", sha: next, mode: "100755" }, { path: "main.tex", sha: next }, { path: "old.tex", sha: null }], "Edit");
    assert.equal(revision, next);
    assert.ok(urls[0].endsWith("/git/ref/heads/release/1.0"), urls[0]);
    assert.ok(urls.at(-1)!.endsWith("/git/refs/heads/release/1.0"), urls.at(-1));
    assert.deepEqual(tree.map(f => [f.path, f.mode]), [["scripts/build.sh", "100755"], ["main.tex", "100644"], ["old.tex", "100644"]]);
    assert.equal(saveProject.parse({ base, changes: [{ path: "a.sh", sha: next, mode: "100755" }] }).changes[0].mode, "100755");
    assert.equal(saveProject.safeParse({ base, changes: [{ path: "a.sh", sha: next, mode: "100000" }] }).success, false);
  } finally {
    globalThis.fetch = original;
  }
});
test("refreshing instructions replaces exactly the marked block and never duplicates a half-marked one", () => {
  const canonical = (JSON.parse(readFileSync(new URL("../shared/project-reminder.json", import.meta.url), "utf8")) as string[]).join("\n");
  const owner = "# Rules\nBudget: $1 per page; $& and $' are plain text here.\n";
  const updated = appendInstructions(owner + "<!-- agentlatex:instructions -->\nold $& text\n<!-- /agentlatex:instructions -->\n");
  assert.equal(updated, owner + canonical + "\n");
  for (const malformed of ["# Notes\n<!-- agentlatex:instructions -->\nunterminated\n", "# Notes\nstray\n<!-- /agentlatex:instructions -->\n"])
    assert.equal(appendInstructions(malformed), malformed);
});
