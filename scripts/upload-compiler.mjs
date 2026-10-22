// Upload the pinned compiler; gzip keeps downloads and the R2 upload below 300 MB.
// Defaults to local Wrangler storage. --remote is an explicit deployment action.
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { createGzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
const files = [
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
await mkdir("data/compiler-upload", { recursive: true });
for (const name of files) {
  const compressed = "data/compiler-upload/" + name + ".gz";
  await pipeline(
    createReadStream("public/compiler/" + name),
    createGzip({ level: 6 }),
    createWriteStream(compressed),
  );
  const type = name.endsWith(".js")
    ? "application/javascript"
    : name.endsWith(".wasm")
      ? "application/wasm"
      : "application/octet-stream";
  const mode = process.argv.includes("--remote") ? "--remote" : "--local";
  await new Promise((resolve, reject) => {
    const p = spawn(
      process.execPath,
      [
        "node_modules/wrangler/bin/wrangler.js",
        "r2",
        "object",
        "put",
        "agentslatex-compiler/1.4.1/" + name,
        "--file",
        compressed,
        "--content-type",
        type,
        "--content-encoding",
        "gzip",
        "--cache-control",
        "public,max-age=31536000,immutable",
        mode,
      ],
      { stdio: "inherit" },
    );
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error("Upload failed: " + name)),
    );
  });
  console.log(
    name +
      ": " +
      ((await stat(compressed)).size / 1024 / 1024).toFixed(2) +
      " MiB transferred",
  );
}
