import { createOAuthUserAuth } from "@octokit/auth-oauth-app";
import { ApiError, github } from "./github";
export type Bindings = Env & {
  GITHUB_CLIENT_SECRET: string;
  SESSION_KEY: string;
};
type Token = {
  token: string;
  refreshToken?: string;
  expiresAt?: string;
  refreshTokenExpiresAt?: string;
};
export interface Session {
  id: string;
  user_id: number;
  login: string;
  token: string;
  expires: number;
  refresh_lock: number;
}
const now = () => Math.floor(Date.now() / 1000);
const bytes = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const encode = (b: Uint8Array) =>
  btoa(Array.from(b, (c) => String.fromCharCode(c)).join(""));
async function key(env: Bindings) {
  return crypto.subtle.importKey(
    "raw",
    bytes(env.SESSION_KEY),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}
export async function seal(env: Bindings, value: unknown) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await key(env),
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return encode(iv) + "." + encode(new Uint8Array(data));
}
async function unseal(env: Bindings, s: string): Promise<Token> {
  const [iv, data] = s.split(".");
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: bytes(iv) },
        await key(env),
        bytes(data),
      ),
    ),
  );
}
export async function hash(s: string) {
  return encode(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)),
    ),
  );
}
export function cookie(req: Request, name: string) {
  return req.headers
    .get("Cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(name + "="))
    ?.slice(name.length + 1);
}
export function setCookie(
  req: Request,
  name: string,
  value: string,
  age: number,
) {
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
}
export function sessionName(req: Request) {
  return new URL(req.url).protocol === "https:"
    ? "__Host-agentslatex"
    : "agentslatex-local";
}
export function originCheck(req: Request) {
  if (req.headers.get("Origin") !== new URL(req.url).origin)
    throw new ApiError(403, "Reload this page before trying again.");
}
export async function session(req: Request, env: Bindings) {
  const raw = cookie(req, sessionName(req));
  if (!raw) throw new ApiError(401, "Connect to GitHub to continue.");
  const row = await env.DB.prepare(
    "SELECT * FROM sessions WHERE id=? AND expires>?",
  )
    .bind(await hash(raw), now())
    .first<Session>();
  if (!row)
    throw new ApiError(
      401,
      "Reconnect to GitHub. Your saved draft is still here.",
    );
  let t = await unseal(env, row.token);
  if (t.expiresAt && Date.parse(t.expiresAt) < Date.now() + 60000) {
    if (!t.refreshToken || !t.refreshTokenExpiresAt)
      throw new ApiError(401, "Reconnect to GitHub.");
    const locked = await env.DB.prepare(
      "UPDATE sessions SET refresh_lock=? WHERE id=? AND refresh_lock<?",
    )
      .bind(now() + 30, row.id, now())
      .run();
    if (!locked.meta.changes)
      throw new ApiError(503, "Reconnecting to GitHub. Try again in a moment.");
    try {
      const auth = createOAuthUserAuth({
        clientType: "github-app",
        clientId: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        token: t.token,
        refreshToken: t.refreshToken,
        expiresAt: t.expiresAt,
        refreshTokenExpiresAt: t.refreshTokenExpiresAt,
      });
      const result = await auth({ type: "refresh" });
      t = pickToken(result);
      await env.DB.prepare(
        "UPDATE sessions SET token=?,refresh_lock=0 WHERE id=?",
      )
        .bind(await seal(env, t), row.id)
        .run();
    } catch {
      await env.DB.prepare("DELETE FROM sessions WHERE id=?")
        .bind(row.id)
        .run();
      throw new ApiError(401, "Reconnect to GitHub. Your draft is safe.");
    }
  }
  return { row, token: t.token };
}
function pickToken(t: Token): Token {
  return {
    token: t.token,
    refreshToken: t.refreshToken,
    expiresAt: t.expiresAt,
    refreshTokenExpiresAt: t.refreshTokenExpiresAt,
  };
}
export async function login(req: Request, env: Bindings) {
  const state = crypto.randomUUID() + crypto.randomUUID();
  await env.DB.batch([
    env.DB.prepare("DELETE FROM oauth_states WHERE expires<?").bind(now()),
    env.DB.prepare("DELETE FROM sessions WHERE expires<?").bind(now()),
    env.DB.prepare(
      "INSERT INTO oauth_states(id,verifier,expires) VALUES(?,?,?)",
    ).bind(await hash(state), "", now() + 600),
  ]);
  const u = new URL("https://github.com/login/oauth/authorize");
  u.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  u.searchParams.set("redirect_uri", env.APP_ORIGIN + "/api/auth/callback");
  u.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      Location: u.href,
      "Set-Cookie": setCookie(req, "agentslatex_oauth", state, 600),
    },
  });
}
export async function callback(req: Request, env: Bindings) {
  const u = new URL(req.url),
    state = u.searchParams.get("state"),
    code = u.searchParams.get("code");
  if (!state || !code || cookie(req, "agentslatex_oauth") !== state)
    throw new ApiError(400, "Sign-in expired. Please connect to GitHub again.");
  const used = await env.DB.prepare(
    "DELETE FROM oauth_states WHERE id=? AND expires>? RETURNING id",
  )
    .bind(await hash(state), now())
    .first();
  if (!used) throw new ApiError(400, "Sign-in expired. Please connect again.");
  const auth = createOAuthUserAuth({
    clientType: "github-app",
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    code,
    redirectUrl: env.APP_ORIGIN + "/api/auth/callback",
  });
  const result = await auth();
  const user = await github<{ id: number; login: string }>(
    result.token,
    "/user",
  );
  const raw = crypto.randomUUID() + crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO sessions(id,user_id,login,token,expires) VALUES(?,?,?,?,?)",
  )
    .bind(
      await hash(raw),
      user.id,
      user.login,
      await seal(env, pickToken(result)),
      now() + 30 * 86400,
    )
    .run();
  const headers = new Headers({ Location: env.APP_ORIGIN + "/?welcome=1" });
  headers.append(
    "Set-Cookie",
    setCookie(req, sessionName(req), raw, 30 * 86400),
  );
  headers.append("Set-Cookie", setCookie(req, "agentslatex_oauth", "", 0));
  return new Response(null, { status: 302, headers });
}
