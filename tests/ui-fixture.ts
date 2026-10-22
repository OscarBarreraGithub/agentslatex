/** Local-only UI fixture. No credentials or production authentication bypass. */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, extname } from "node:path";
import { templateFiles } from "../shared/template";
const origin = "http://127.0.0.1:4393";
let rev = 1;
let created = false;
const contents = new Map<string, Buffer>();
const blobs = new Map<string, Buffer>();
const hash = (b: Buffer) => createHash("sha1").update(b).digest("hex");
for (const [p, s] of Object.entries(templateFiles()))
  contents.set(p, Buffer.from(s));
const project = {
  id: 999991,
  owner: "local-ui-fixture",
  name: "test-paper",
  branch: "main",
  main: "paper/main.tex",
  engine: "pdf",
  url: "https://github.com",
  writable: true,
};
function entries() {
  return [...contents].map(([path, b]) => {
    const sha = hash(b);
    blobs.set(sha, b);
    return { path, sha, size: b.length, type: "blob", mode: "100644" };
  });
}
const revision = () => String(rev).padStart(40, "0");
http
  .createServer(async (req, res) => {
    try {
      const u = new URL(req.url!, origin);
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
      res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
      const send = (v: unknown, status = 200) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(v));
      };
      const p = u.pathname;
      if (p.startsWith("/api/")) {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c);
        const raw = Buffer.concat(chunks);
        const body = req.headers["content-type"]?.includes("json")
          ? JSON.parse(raw.toString() || "{}")
          : {};
        if (p === "/api/me")
          return send({
            user: { id: 999991, login: "Local UI fixture" },
            installations: 1,
            installUrl: "#",
          });
        if (p === "/api/projects" && req.method === "GET")
          return send(created ? [project] : []);
        if (p === "/api/projects" && req.method === "POST") {
          created = true;
          project.name = body.name;
          return send(project, 201);
        }
        if (p === "/api/repositories") return send([]);
        if (p === "/api/projects/999991/head") return send({ revision: revision() });
        if (p.endsWith("/file")) {
          const b = blobs.get(u.searchParams.get("sha")!);
          res.writeHead(b ? 200 : 404, {
            "Content-Type": "application/octet-stream",
          });
          res.end(b);
          return;
        }
        if (p.endsWith("/blob")) {
          const sha = hash(raw);
          blobs.set(sha, raw);
          return send({ sha });
        }
        if (p.endsWith("/save")) {
          if (body.base !== revision())
            return send(
              {
                error: "GitHub has newer changes. Your draft is safe.",
                code: "conflict",
              },
              409,
            );
          for (const c of body.changes)
            c.sha
              ? contents.set(c.path, blobs.get(c.sha)!)
              : contents.delete(c.path);
          rev++;
          return send({ revision: revision() });
        }
        if (p === "/api/fixture/external" && req.method === "POST") {
          contents.set(
            "paper/main.tex",
            Buffer.from(
              contents
                .get("paper/main.tex")!
                .toString()
                .replace(
                  "Your paper starts here.",
                  "A collaborator updated this paragraph.",
                ),
            ),
          );
          rev++;
          return send({ revision: revision() });
        }
        if (p === "/api/projects/999991")
          return send({ project, revision: revision(), files: entries() });
        return send({ error: "Fixture route not found" }, 404);
      }
      const compiler = p.startsWith("/compiler/1.4.1/");
      const base = resolve(compiler ? "public/compiler" : "dist");
      const file = resolve(
        base,
        compiler
          ? p.slice("/compiler/1.4.1/".length)
          : p === "/"
            ? "index.html"
            : "." + p,
      );
      if (!file.startsWith(base + "/")) {
        res.writeHead(404);
        res.end();
        return;
      }
      const info = await stat(file);
      const types: Record<string, string> = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".wasm": "application/wasm",
        ".svg": "image/svg+xml",
      };
      res.writeHead(200, {
        "Content-Type": types[extname(file)] ?? "application/octet-stream",
        "Content-Length": info.size,
      });
      createReadStream(file).pipe(res);
    } catch (e) {
      res.writeHead(500);
      res.end((e as Error).message);
    }
  })
  .listen(4393, "127.0.0.1", () => console.log("Local UI fixture: " + origin));
