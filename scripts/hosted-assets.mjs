import { writeFile, copyFile, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { zipSync } from "fflate";
await writeFile(
  "dist/_headers",
  `/*
  Cross-Origin-Opener-Policy: same-origin
  Cross-Origin-Embedder-Policy: require-corp
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: no-referrer
  Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://github.com
`,
);
await copyFile("LICENSE", "dist/LICENSE");
await copyFile("NOTICE.md", "dist/NOTICE.md");
// Offer this deployed version's source, without runtime data or credentials.
const paths = execFileSync(
  "git",
  ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
  { encoding: "utf8" },
)
  .split("\0")
  .filter(Boolean);
const source = {};
for (const path of paths) {
  if (
    !/^(src\/|shared\/|worker\/|scripts\/|tests\/|docs\/|(?:AGENTS\.md|README\.md|SPEC\.md|latex-specs\.md|NOTICE\.md|LICENSE|package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|vite\.config\.ts|tsconfig(?:\.worker)?\.json|wrangler\.jsonc|index\.html|tests\.html|\.gitignore)$)/.test(
      path,
    )
  )
    continue;
  source["agentslatex/" + path] = new Uint8Array(await readFile(path));
}
await writeFile("dist/source.zip", zipSync(source, { level: 6 }));
