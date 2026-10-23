import { defineConfig } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export default defineConfig({
  publicDir: process.env.DEPLOY === "1" ? false : "public",
  plugins: [
    {
      name: "local-test-evidence",
      configureServer(server) {
        server.middlewares.use("/__test-results/", async (req, res, next) => {
          if (req.method !== "POST") return next();
          const match = req.url?.match(
            /^\/?([a-zA-Z0-9-]+)\/([a-z0-9-]+\.(?:json|pdf|gz|log))$/,
          );
          if (req.headers.origin !== "http://127.0.0.1:4390" || !match) {
            res.statusCode = 403;
            res.end();
            return;
          }
          try {
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of req) {
              size += chunk.length;
              if (size > 150 * 1024 * 1024) throw Error("Result too large");
              chunks.push(chunk);
            }
            const folder = resolve("data/results", match[1]);
            await mkdir(folder, { recursive: true });
            await writeFile(resolve(folder, match[2]), Buffer.concat(chunks));
            res.end("saved");
          } catch {
            res.statusCode = 500;
            res.end("Could not save evidence");
          }
        });
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 4390,
    strictPort: true,
    cors: false,
    fs: { strict: true },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4390,
    strictPort: true,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
  build: {
    // The compiler laboratory needs the local fixtures and evidence route; the hosted
    // build ships neither, so it does not ship the page either.
    rollupOptions: { input: process.env.DEPLOY === "1" ? { editor: "index.html" } : { editor: "index.html", tests: "tests.html" } },
  },
});
