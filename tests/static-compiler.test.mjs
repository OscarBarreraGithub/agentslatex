import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { compilerFetch } from "../scripts/static-compiler.mjs";

const folder = "dist/compiler/1.4.1-static2";
const base = "https://agentlatex.com/compiler/1.4.1-static2/";
const manifest = JSON.parse(await readFile(folder + "/manifest.json", "utf8"));
const fetchFile = async (url) => {
  const path = new URL(url).pathname.split("/").pop();
  return new Response(await readFile(folder + "/" + path));
};

test("all deployed assets fit Static Assets; rebuilt compiler binaries are byte-identical", async () => {
  for (const name of await readdir(folder))
    assert.ok((await stat(folder + "/" + name)).size < 25 * 1024 * 1024, name);
  const load = compilerFetch(manifest, fetchFile, base);
  for (const [name, entry] of Object.entries(manifest)) {
    const response = await load(base + name);
    const hash = createHash("sha256");
    for await (const bytes of response.body) hash.update(bytes);
    assert.equal(hash.digest("hex"), entry.sha256, name);
    const original = createHash("sha256").update(await readFile("public/compiler/" + name)).digest("hex");
    assert.equal(entry.sha256, original);
  }
});

test("failed part reports an error; a new download can retry successfully", async () => {
  const load = compilerFetch(manifest, async () => new Response("Missing", { status: 404 }), base);
  await assert.rejects((await load(base + "busytex.wasm")).arrayBuffer(), /Compiler download failed \(404\)/);
  const retry = compilerFetch(manifest, fetchFile, base);
  assert.equal((await (await retry(base + "busytex.wasm")).arrayBuffer()).byteLength, manifest["busytex.wasm"].size);
});
