/** Local-only UI fixture. No credentials or production authentication bypass. */
import http from "node:http";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, extname } from "node:path";
import { templateFiles } from "../shared/template";
const firstProject = process.argv.includes("--first-project");
const port = firstProject ? 4394 : 4393;
const origin = `http://127.0.0.1:${port}`;
let authorized = false;
let rev = 1;
let created = false;
const contents = new Map<string, Buffer>();
const blobs = new Map<string, Buffer>();
// Real Git blob IDs: the editor verifies downloaded bytes against the tree entry.
const hash = (b: Buffer) => createHash("sha1").update(`blob ${b.length}\0`).update(b).digest("hex");
for (const [p, s] of Object.entries(templateFiles("paper")))
  contents.set(p, Buffer.from(s));
// Exercise a legacy project plus a selected standalone file with relative inputs.
contents.set(".agentlatex.json", Buffer.from(JSON.stringify({ version: 1, main: "paper/main.tex", engine: "pdf" })));
contents.set("paper/alternate.tex", Buffer.from(String.raw`\documentclass{article}
\begin{document}
SELECTED DOCUMENT TEST
\input{sections/intro}
\input{../shared/evidence}
\end{document}`));
contents.set("paper/sections/intro.tex", Buffer.from("Local relative input works."));
contents.set("shared/evidence.tex", Buffer.from("Linked repository input works."));
contents.set("paper/notes.md", Buffer.from("# Research notes\n\n**Markdown preview** with a list.\n\n- First result\n- Second result\n\n<script>alert('unsafe')</script>\n\n![External image](https://example.com/pixel)\n"));
const project = {
  id: 999992,
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
            user: { id: 999992, login: "local-ui-fixture" },
            installUrl: "#",
          });
        if (p === "/api/projects" && req.method === "GET")
          return send(created ? [project] : []);
        if (p === "/api/projects" && req.method === "POST") {
          if (firstProject) {
            project.name = body.name;
            console.log("First project: GitHub creation denied before installation");
            return send({error:"Resource not accessible by integration",code:"repository_creation_setup"},403);
          }
          created = true;
          project.name = body.name;
          return send(project, 201);
        }
        if (p === "/api/repositories") return send(authorized ? [{...project, full_name:project.owner+"/"+project.name, private:true, owner:{login:project.owner}, permissions:{push:true}}] : []);
        if (p === "/api/fixture/authorize" && req.method === "POST") { authorized=true; return send({ok:true}); }
        if (p === "/api/connect" && req.method === "POST") {
          if (!authorized) return send({error:"Not authorized"},403);
          created=true; console.log("First project: connected after explicit repository authorization"); return send(project);
        }
        if (p === "/api/projects/999992/head") return send({ revision: revision() });
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
        if (p === "/api/projects/999992")
          return send({ project, revision: revision(), files: entries() });
        return send({ error: "Fixture route not found" }, 404);
      }
      const compiler = p.startsWith("/compiler/1.4.1/");
      const base = resolve(compiler ? "public/compiler" : "dist");
      let file = resolve(
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
      if (p.startsWith("/docs") && !extname(file) && p !== "/docs" && p !== "/docs/") file += ".html";
      let info = await stat(file);
      if (info.isDirectory()) {
        file = resolve(file, "index.html");
        info = await stat(file);
      }
      const types: Record<string, string> = {
        ".html": "text/html",
        ".md": "text/plain; charset=utf-8",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
        ".wasm": "application/wasm",
        ".svg": "image/svg+xml",
        ".png": "image/png",
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
  .listen(port, "127.0.0.1", () => console.log("Local UI fixture: " + origin));
