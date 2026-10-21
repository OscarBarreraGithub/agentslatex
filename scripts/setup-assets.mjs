import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, copyFile, access, readdir } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dirname, "..");
const target = join(root, "public/compiler");
await mkdir(target, { recursive: true });
const required = [
  "busytex.js",
  "busytex.wasm",
  "busytex_worker.js",
  "busytex_pipeline.js",
  "busytex_biber.js",
  "texlive-extra.js",
  "texlive-extra.data",
  "biber.js",
  "biber.wasm",
  "biber.data",
];
if (!process.argv.includes("--from")) {
  try {
    await Promise.all(required.map((name) => access(join(target, name))));
    console.log("Compiler assets already installed.");
    process.exit(0);
  } catch {}
}
let source;
const from = process.argv.indexOf("--from");
if (from >= 0) source = resolve(process.argv[from + 1]);
else {
  const dir = join(root, "data/download");
  await mkdir(dir, { recursive: true });
  const archive = join(dir, "assets.tar.gz");
  const url =
    "https://github.com/TeXlyre/texlyre-busytex/releases/download/assets-v1.4.1/busytex-assets.tar.gz";
  console.log("Downloading pinned compiler assets (about 498 MiB, once)…");
  const response = await fetch(url);
  if (!response.ok || !response.body)
    throw Error("Asset download failed: " + response.status);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(archive));
  const hash = createHash("sha256");
  for await (const bytes of createReadStream(archive)) hash.update(bytes);
  if (
    hash.digest("hex") !==
    "4f63731fe4ec9238d877846074ab424350add6f6e956944def389e6752d2c78b"
  )
    throw Error("Asset checksum mismatch; nothing installed");
  execFileSync("tar", ["-xzf", archive, "-C", dir]);
  source = join(dir, "busytex");
}
for (const name of await readdir(source))
  await copyFile(join(source, name), join(target, name));
console.log("Installed BusyTeX assets-v1.4.1. Assets stay ignored by Git.");
