import type { Repo, Entry } from "../shared/contracts";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public retryAfterSeconds = 0,
  ) {
    super(message);
  }
}
/** Git refs may contain "/"; encode each segment so the path stays valid either way. */
export const refPath = (branch: string) => branch.split("/").map(encodeURIComponent).join("/");
/** A GitHub outage or timeout is temporary; report it as such instead of a generic failure. */
export async function githubFetch(input: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (e) {
    if (e instanceof DOMException && (e.name === "TimeoutError" || e.name === "AbortError"))
      throw new ApiError(503, "GitHub did not respond in time. Your draft is safe; please try again.", undefined, 30);
    if (e instanceof TypeError)
      throw new ApiError(503, "GitHub could not be reached. Your draft is safe; please try again.", undefined, 30);
    throw e;
  }
}
export async function github<T>(
  token: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const res = await githubFetch("https://api.github.com" + path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "AgentsLaTeX",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) {
    // Outages return HTML or empty bodies; a parse failure must not hide the real status.
    let data: { message?: string } = {};
    try {
      const parsed: unknown = JSON.parse(await res.text());
      if (parsed && typeof parsed === "object") data = parsed;
    } catch { /* not JSON */ }
    const throttled = res.status === 429 || res.headers.has("retry-after") || res.headers.get("x-ratelimit-remaining") === "0";
    const wait = Math.max(Number(res.headers.get("retry-after")) || 0,
      res.headers.get("x-ratelimit-remaining") === "0" ? (Number(res.headers.get("x-ratelimit-reset")) || 0) - Date.now() / 1000 : 0,
      throttled ? 60 : 0);
    throw new ApiError(
      res.status === 401
        ? 401
        : res.status === 404
          ? 404
          : res.status === 409 || res.status === 422
            ? 409
            : throttled
              ? 429
              : res.status >= 500
                ? 503
              : 403,
      data.message ?? "GitHub request failed.",
      undefined,
      Math.ceil(wait),
    );
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}
export async function listRepos(token: string) {
  const installations: { id: number; account: { login: string } }[] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await github<{ installations: typeof installations }>(
      token,
      `/user/installations?per_page=100&page=${page}`,
    );
    installations.push(...r.installations);
    if (r.installations.length < 100) break;
  }
  const repositories: Repo[] = [];
  for (const i of installations) {
    for (let page = 1; page <= 20; page++) {
      const r = await github<{ repositories: Repo[] }>(
        token,
        `/user/installations/${i.id}/repositories?per_page=100&page=${page}`,
      );
      repositories.push(...r.repositories);
      if (r.repositories.length < 100) break;
    }
  }
  return {
    installations,
    repositories: [...new Map(repositories.map((r) => [r.id, r])).values()],
  };
}
export async function readTree(
  token: string,
  repo: Repo,
  branch = repo.default_branch,
) {
  const root = "/repos/" + repo.full_name;
  const ref = await github<{ object: { sha: string } }>(
    token,
    root + "/git/ref/heads/" + refPath(branch),
  );
  const commit = await github<{ tree: { sha: string } }>(
    token,
    root + "/git/commits/" + ref.object.sha,
  );
  const tree = await github<{ tree: Entry[]; truncated: boolean }>(
    token,
    root + "/git/trees/" + commit.tree.sha + "?recursive=1",
  );
  if (tree.truncated)
    throw new ApiError(
      413,
      "This repository is too large to open completely. Use a dedicated paper repository.",
    );
  return {
    revision: ref.object.sha,
    tree: commit.tree.sha,
    files: tree.tree.filter(
      (f) => f.type === "blob" && ["100644", "100755"].includes(f.mode),
    ),
  };
}
// Setup can browse an empty repository without creating anything on a GET.
export async function readSetupTree(token: string, repo: Repo) {
  try {
    return await readTree(token, repo);
  } catch (e) {
    if (e instanceof ApiError && e.status === 409 && /repository is empty/i.test(e.message))
      return null;
    throw e;
  }
}
export async function initializeRepository(token: string, repo: Repo, readme: string) {
  try {
    // The Git database API cannot initialize an empty repository. Contents can.
    // Omitting sha makes this create-only: never replace a collaborator's README.
    await github(token, "/repos/" + repo.full_name + "/contents/README.md", "PUT", {
      message: "Initialize paper for AgentsLaTeX",
      content: btoa(String.fromCharCode(...new TextEncoder().encode(readme))),
      branch: repo.default_branch,
    });
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 409) throw e;
    // Another setup may have created the first commit while this request ran.
  }
  // GitHub can acknowledge the Contents write before Git refs expose that commit.
  for (const delay of [0, 500, 1500]) {
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    const current = await readSetupTree(token, repo);
    if (current) return current;
  }
  throw new ApiError(503, "GitHub is still preparing your repository. Please try again in a moment.");
}
export async function commitFiles(
  token: string,
  repo: Repo,
  branch: string,
  base: string,
  changes: { path: string; sha: string | null; mode?: string }[],
  message: string,
) {
  const root = "/repos/" + repo.full_name;
  const current = await github<{ object: { sha: string } }>(
    token,
    root + "/git/ref/heads/" + refPath(branch),
  );
  if (current.object.sha !== base)
    throw new ApiError(
      409,
      "GitHub has newer changes. Your draft is safe. Refresh and resolve the changed files.",
      "conflict",
    );
  const parent = await github<{ tree: { sha: string } }>(
    token,
    root + "/git/commits/" + base,
  );
  const tree = await github<{ sha: string }>(
    token,
    root + "/git/trees",
    "POST",
    {
      base_tree: parent.tree.sha,
      tree: changes.map((f) => ({
        ...f,
        mode: f.mode ?? "100644",
        type: "blob",
      })),
    },
  );
  const commit = await github<{ sha: string }>(
    token,
    root + "/git/commits",
    "POST",
    { message, tree: tree.sha, parents: [base] },
  );
  try {
    await github(
      token,
      root + "/git/refs/heads/" + refPath(branch),
      "PATCH",
      { sha: commit.sha, force: false },
    );
  } catch (e) {
    if (e instanceof ApiError && e.status === 409)
      throw new ApiError(
        409,
        "GitHub changed while saving. Your draft is safe. Refresh to resolve it.",
        "conflict",
      );
    throw e;
  }
  return commit.sha;
}
