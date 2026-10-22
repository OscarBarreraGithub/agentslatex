import { z } from "zod";
import {
  newProject,
  connectProject,
  saveProject,
  sha,
  type Repo,
  type Project,
  type Entry,
} from "../shared/contracts";
import { parentFolder, inFolder, joinFolder, defaultMainFolder } from "../shared/workspace";
import { templateFiles } from "../shared/template";
import { connectInstructions } from "../shared/instructions";
import { ApiError, github, listRepos, readTree, commitFiles } from "./github";
import {
  session,
  renewSession,
  login,
  callback,
  originCheck,
  setCookie,
  sessionName,
  cookie,
  hash,
  type Bindings,
} from "./auth";
type ProjectRow = {
  repo_id: number;
  owner: string;
  name: string;
  branch: string;
  main: string;
  engine: "pdf" | "lua" | "xe";
};
const json = (data: unknown, status = 200) => Response.json(data, { status });
const root = (r: Repo) => "/repos/" + r.full_name;
const asProject = (r: ProjectRow, repo: Repo): Project => ({
  id: r.repo_id,
  owner: repo.owner.login,
  name: repo.name,
  branch: r.branch,
  main: r.main,
  engine: r.engine,
  url: repo.html_url,
  writable: !!repo.permissions?.push,
  updatedAt: repo.pushed_at,
});
async function body(req: Request) {
  const raw = await limitedBody(req, 1_000_000);
  try {
    return JSON.parse(new TextDecoder().decode(raw));
  } catch {
    throw new ApiError(400, "Invalid request.");
  }
}
async function limitedBody(req: Request, max: number) {
  if (Number(req.headers.get("Content-Length")) > max)
    throw new ApiError(
      413,
      "This file is too large. The maximum is 20 MB per file.",
    );
  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = req.body?.getReader();
  if (reader) {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > max) {
          await reader.cancel();
          throw new ApiError(
            413,
            "This file is too large. The maximum is 20 MB per file.",
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
  }
  const out = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}
async function repoFor(token: string, id: number, write = false) {
  const r = await github<Repo>(token, "/repositories/" + id);
  if (write && !r.permissions?.push)
    throw new ApiError(403, "You need write access to this GitHub repository.");
  return r;
}
async function projectFor(
  env: Bindings,
  token: string,
  id: number,
  write = false,
) {
  const row = await env.DB.prepare("SELECT * FROM projects WHERE repo_id=?")
    .bind(id)
    .first<ProjectRow>();
  if (!row) throw new ApiError(404, "Project not found.");
  const repo = await repoFor(token, id, write);
  return { row, repo, project: asProject(row, repo) };
}
async function register(env: Bindings, r: Repo, main: string, engine: string) {
  await env.DB.prepare(
    "INSERT INTO projects(repo_id,owner,name,branch,main,engine,created) VALUES(?,?,?,?,?,?,?) ON CONFLICT(repo_id) DO UPDATE SET owner=excluded.owner,name=excluded.name",
  )
    .bind(
      r.id,
      r.owner.login,
      r.name,
      r.default_branch,
      main,
      engine,
      Date.now(),
    )
    .run();
}
async function putTexts(
  token: string,
  repo: Repo,
  branch: string,
  base: string,
  files: Record<string, string>,
  message: string,
) {
  const changes = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await github<{ sha: string }>(
      token,
      root(repo) + "/git/blobs",
      "POST",
      { content, encoding: "utf-8" },
    );
    changes.push({ path, sha: blob.sha });
  }
  return commitFiles(token, repo, branch, base, changes, message);
}
async function blobText(token: string, repo: Repo, entry: Entry) {
  if (entry.size > 100_000)
    throw new ApiError(
      413,
      "The existing instruction file is unusually large. Connect after reviewing it in GitHub.",
    );
  const b = await github<{ content: string }>(
    token,
    root(repo) + "/git/blobs/" + entry.sha,
  );
  return new TextDecoder().decode(
    Uint8Array.from(atob(b.content.replaceAll("\n", "")), (c) =>
      c.charCodeAt(0),
    ),
  );
}
async function handle(req: Request, env: Bindings): Promise<Response> {
  const u = new URL(req.url),
    path = u.pathname;
  if (path === "/api/health") return json({ ok: true, service: "agentslatex" });
  if (path === "/api/auth/login") return login(req, env);
  if (path === "/api/auth/callback") return callback(req, env);
  if (!path.startsWith("/api/")) return env.ASSETS.fetch(req);
  if (!["GET", "HEAD"].includes(req.method)) originCheck(req);
  if (path === "/api/auth/logout" && req.method === "POST") {
    // Logout must work even when the GitHub token expired or refresh is unavailable.
    const raw = cookie(req, sessionName(req));
    if (raw) await env.DB.prepare("DELETE FROM sessions WHERE id=?")
      .bind(await hash(raw)).run();
    return new Response("{}", {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": setCookie(req, sessionName(req), "", 0),
      },
    });
  }
  const auth = await session(req, env),
    token = auth.token;
  if (path === "/api/me") {
    const response = json({
      user: { id: auth.row.user_id, login: auth.row.login },
      installUrl: `https://github.com/apps/${env.GITHUB_APP_SLUG}/installations/new`,
    });
    const renewed = await renewSession(req, env, auth.row);
    if (renewed) response.headers.set("Set-Cookie", renewed);
    return response;
  }
  if (path === "/api/installation-status") {
    const { installations } = await listRepos(token);
    return json({ installations: installations.length });
  }
  if (path === "/api/repositories") {
    const { repositories } = await listRepos(token);
    return json(repositories.filter((r) => r.permissions?.push));
  }
  if (path === "/api/projects" && req.method === "GET") {
    const { repositories } = await listRepos(token);
    const rows = await env.DB.prepare(
      "SELECT * FROM projects ORDER BY created DESC",
    ).all<ProjectRow>();
    const allowed = new Map(repositories.map((r) => [r.id, r]));
    return json(
      rows.results
        .filter((r) => allowed.has(r.repo_id))
        .map((r) => asProject(r, allowed.get(r.repo_id)!)),
    );
  }
  if (path === "/api/projects" && req.method === "POST") {
    const input = newProject.parse(await body(req));
    const prior = await env.DB.prepare(
      "SELECT name,repo_id FROM creations WHERE user_id=? AND request_id=?",
    )
      .bind(auth.row.user_id, input.requestId)
      .first<{ name: string; repo_id: number | null }>();
    if (prior && prior.name !== input.name)
      throw new ApiError(
        409,
        "Please reopen New project to use a different name.",
      );
    let repo: Repo;
    if (prior?.repo_id) {
      repo = await repoFor(token, prior.repo_id, true);
      const registered = await env.DB.prepare(
        "SELECT repo_id FROM projects WHERE repo_id=?",
      )
        .bind(repo.id)
        .first();
      if (registered)
        return json((await projectFor(env, token, repo.id)).project);
    } else {
      await env.DB.prepare(
        "INSERT OR IGNORE INTO creations(user_id,request_id,name,created) VALUES(?,?,?,?)",
      )
        .bind(auth.row.user_id, input.requestId, input.name, Date.now())
        .run();
      try {
        repo = await github<Repo>(token, "/user/repos", "POST", {
          name: input.name,
          private: true,
          auto_init: true,
          description: "A paper workspace for AgentsLaTeX",
          has_wiki: false,
          has_projects: false,
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 403)
          throw new ApiError(
            403,
            "GitHub has not granted repository creation for this account. Create the project on GitHub, then connect that repository.",
            "repository_creation_setup",
          );
        if (e instanceof ApiError && e.status === 409)
          throw new ApiError(
            409,
            "A repository with that name already exists. Connect it from Projects, or choose another name.",
          );
        throw e;
      }
      await env.DB.prepare(
        "UPDATE creations SET repo_id=? WHERE user_id=? AND request_id=?",
      )
        .bind(repo.id, auth.row.user_id, input.requestId)
        .run();
    }
    const tree = await readTree(token, repo);
    if (!tree.files.some((f) => f.path === ".agentlatex.json")) {
      if (prior?.repo_id && tree.files.some((f) => f.path !== "README.md"))
        throw new ApiError(
          409,
          "This new repository has changed. Connect it from Projects to preserve those files.",
        );
      await putTexts(
        token,
        repo,
        repo.default_branch,
        tree.revision,
        templateFiles(),
        "Start paper with AgentsLaTeX",
      );
    }
    await register(env, repo, joinFolder(defaultMainFolder, "main.tex"), "pdf");
    return json((await projectFor(env, token, repo.id)).project, 201);
  }
  if (path === "/api/connect" && req.method === "POST") {
    const input = connectProject.parse(await body(req));
    const repo = await repoFor(token, input.repositoryId, true);
    let tree;
    try {
      tree = await readTree(token, repo);
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && /empty/i.test(e.message))
        throw new ApiError(409, "Add a README to this empty repository on GitHub, then finish setup again.");
      throw e;
    }
    const folder = input.folder ?? (input.main ? parentFolder(input.main) : defaultMainFolder);
    const main = input.main ?? joinFolder(folder, "main.tex");
    if (!inFolder(main, folder) || !/\.tex$/i.test(main))
      throw new ApiError(400, "Choose a .tex document inside the main folder.");
    if (input.main && !tree.files.some(f => f.path === main))
      throw new ApiError(400, "That document was not found. Choose it again.");
    const existing = await env.DB.prepare(
      "SELECT repo_id FROM projects WHERE repo_id=?",
    )
      .bind(repo.id)
      .first();
    if (existing) return json((await projectFor(env, token, repo.id)).project);
    const files = await connectInstructions(tree.files.map(f => f.path), folder,
      path => blobText(token, repo, tree.files.find(f => f.path === path)!));
    const templates = templateFiles(folder);
    if (!tree.files.some(f => f.path === main)) {
      for (const [path, content] of Object.entries(templates))
        if (!path.endsWith("AGENTS.md") && inFolder(path, folder) && !tree.files.some(f => f.path === path) && !(path in files)) files[path] = content;
    }
    const priorConfig = tree.files.find(f => f.path === ".agentlatex.json");
    const preserved = priorConfig ? JSON.parse(await blobText(token, repo, priorConfig)) : {};
    files[".agentlatex.json"] = JSON.stringify({ ...preserved, version: 1, folder, main, engine: input.engine }, null, 2) + "\n";
    if (Object.keys(files).length)
      await putTexts(
        token,
        repo,
        repo.default_branch,
        tree.revision,
        files,
        "Connect paper to AgentsLaTeX",
      );
    await register(env, repo, main, input.engine);
    return json((await projectFor(env, token, repo.id)).project);
  }
  const repository = path.match(/^\/api\/repositories\/(\d+)\/files$/);
  if (repository) {
    const repo = await repoFor(token, Number(repository[1]));
    return json(await readTree(token, repo));
  }
  const match = path.match(
    /^\/api\/projects\/(\d+)(?:\/(file|blob|save|head))?$/,
  );
  if (match) {
    const write = ["POST", "PUT"].includes(req.method);
    const { repo, row, project } = await projectFor(
      env,
      token,
      Number(match[1]),
      write,
    );
    if (!match[2] && req.method === "GET") {
      const tree = await readTree(token, repo, row.branch);
      return json({ project, revision: tree.revision, files: tree.files });
    }
    if (match[2] === "head" && req.method === "GET") {
      const ref = await github<{ object: { sha: string } }>(
        token,
        root(repo) + "/git/ref/heads/" + encodeURIComponent(row.branch),
      );
      return json({ revision: ref.object.sha });
    }
    if (match[2] === "file" && req.method === "GET") {
      const id = sha.parse(u.searchParams.get("sha"));
      const r = await fetch(
        "https://api.github.com" + root(repo) + "/git/blobs/" + id,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.raw+json",
            "User-Agent": "AgentsLaTeX",
          },
          signal: AbortSignal.timeout(30000),
        },
      );
      if (!r.ok)
        throw new ApiError(r.status, "Could not load this file from GitHub.");
      return new Response(r.body, {
        headers: { "Content-Type": "application/octet-stream" },
      });
    }
    if (match[2] === "blob" && req.method === "PUT") {
      const bytes = await limitedBody(req, 20 * 1024 * 1024);
      let b64 = "";
      for (let i = 0; i < bytes.length; i += 16384)
        b64 += String.fromCharCode(...bytes.subarray(i, i + 16384));
      const b = await github<{ sha: string }>(
        token,
        root(repo) + "/git/blobs",
        "POST",
        { content: btoa(b64), encoding: "base64" },
      );
      return json({ sha: b.sha });
    }
    if (match[2] === "save" && req.method === "POST") {
      const input = saveProject.parse(await body(req));
      if (
        new Set(input.changes.map((f) => f.path)).size !== input.changes.length
      )
        throw new ApiError(400, "Duplicate file paths.");
      const revision = await commitFiles(
        token,
        repo,
        row.branch,
        input.base,
        input.changes,
        input.message,
      );
      return json({ revision });
    }
  }
  throw new ApiError(404, "Not found.");
}
export default {
  async fetch(req: Request, env: Bindings): Promise<Response> {
    let response: Response;
    try {
      response = await handle(req, env);
    } catch (e) {
      const status =
        e instanceof ApiError ? e.status : e instanceof z.ZodError ? 400 : 500;
      const message =
        e instanceof ApiError
          ? e.message
          : e instanceof z.ZodError
            ? e.issues.map((i) => i.message).join(" ")
            : "Something went wrong. Your draft is safe; please try again.";
      response =
        new URL(req.url).pathname === "/api/auth/callback"
          ? new Response(null, {
              status: 302,
              headers: { Location: env.APP_ORIGIN + "/?signin=retry" },
            })
          : json(
              {
                error: message,
                code: e instanceof ApiError ? e.code : undefined,
              },
              status,
            );
      if (e instanceof ApiError && e.retryAfterSeconds > 0)
        response.headers.set("Retry-After", String(e.retryAfterSeconds));
    }
    const out = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      encodeBody: response.headers.has("Content-Encoding")
        ? "manual"
        : "automatic",
    });
    const h = out.headers;
    h.set("X-Content-Type-Options", "nosniff");
    h.set("Referrer-Policy", "no-referrer");
    h.set("Cross-Origin-Opener-Policy", "same-origin");
    h.set("Cross-Origin-Embedder-Policy", "require-corp");
    h.set("X-Frame-Options", "DENY");
    if (new URL(req.url).pathname.startsWith("/api/"))
      h.set("Cache-Control", "no-store");
    h.set(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self' https://github.com",
    );
    return out;
  },
};
