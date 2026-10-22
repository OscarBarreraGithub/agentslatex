import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { buildSignature } from "../src/cache";
import type { Entry } from "../shared/contracts";
const file = {path:"paper/main.tex", content:"Original"};
const sha = createHash("sha1").update(`blob ${Buffer.byteLength(file.content)}\0${file.content}`).digest("hex");
const entries: Entry[] = [{path:file.path, sha, size:8, mode:"100644", type:"blob"}];
test("PDF cache signature matches a saved draft but changes with inputs, path or engine", async () => {
  const key = (files = [file], dirty: string[] = [], target = file.path, engine = "pdf", remote = entries) =>
    buildSignature(files.map(f=>f.path), remote, new Map(files.map(f=>[f.path,f])), new Set(dirty), target, engine);
  const original = await key();
  assert.equal(await key([file], [file.path]), original);
  assert.notEqual(await key([{...file, content:"Changed"}], [file.path]), original);
  assert.notEqual(await key([file], [], file.path, "xe"), original);
  assert.notEqual(await key([file], [], "paper/other.tex"), original);
  assert.notEqual(await key([file], [], file.path, "pdf", [{...entries[0], sha:"different"}]), original);
  assert.notEqual(await key([file, {path:"shared/image.png", content:"new input"}]), original);
});
