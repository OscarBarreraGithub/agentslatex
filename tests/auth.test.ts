import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index";
import { seal, session, login, SESSION_SECONDS, type Session, type Bindings } from "../worker/auth";
const now = () => Math.floor(Date.now()/1000);
async function fixture(expires = now()+86400, token = {token:"synthetic-access"}) {
  let writes = 0, deleted = false;
  const row: Session = {id:"synthetic", user_id:42, login:"fixture", expires, refresh_lock:0, token:""};
  const env = { SESSION_KEY: btoa("a".repeat(32)), GITHUB_CLIENT_ID:"fixture", GITHUB_CLIENT_SECRET:"fixture", GITHUB_APP_SLUG:"fixture",
    DB: { prepare(sql: string) {
      let values: unknown[] = [];
      return { bind(...args:unknown[]) { values=args; return this; },
        async first() { return !deleted && row.expires>now() ? row : null; },
        async run() { writes++;
          if(sql.startsWith("DELETE")) deleted=true;
          if(sql.startsWith("UPDATE sessions SET expires")) row.expires=Number(values[0]);
          if(sql.startsWith("UPDATE sessions SET refresh_lock=0")) row.refresh_lock=0;
          return {meta:{changes:1}};
        } };
    } }
  } as unknown as Bindings;
  row.token=await seal(env,token);
  const req=new Request("https://agentlatex.com/api/me",{headers:{Cookie:"__Host-agentslatex=synthetic-cookie"}});
  return {env,req,row,writes:()=>writes,deleted:()=>deleted};
}
test("existing sessions renew to 180 days; identity does not fetch GitHub repositories", async () => {
  const f=await fixture(); const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error("Unexpected GitHub call");};
  try {
    const response=await worker.fetch(f.req,f.env);
    assert.equal(response.status,200);
    assert.equal((await response.json() as {user:{id:number}}).user.id,42);
    const cookie=response.headers.get("set-cookie")!;
    assert.match(cookie,new RegExp(`Max-Age=${SESSION_SECONDS}`));
    assert.match(cookie,/HttpOnly; SameSite=Lax/); assert.match(cookie,/Secure/);
    assert.equal(f.writes(),1);
    const again=await worker.fetch(f.req,f.env);
    assert.equal(again.headers.get("set-cookie"),null); assert.equal(f.writes(),1);
  } finally { globalThis.fetch=original; }
});
test("expired sessions are refused rather than resurrected",async()=>{
  const f=await fixture(now()-1); const response=await worker.fetch(f.req,f.env);
  assert.equal(response.status,401); assert.equal(f.writes(),0);
});
test("identity remains available during GitHub token refresh and never reveals credentials", async () => {
  const f=await fixture(now()+86400, {token:"synthetic", refreshToken:"synthetic-refresh", expiresAt:new Date(0).toISOString()} as {token:string});
  f.row.refresh_lock=now()+30;
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error("Identity must not depend on GitHub availability");};
  try {
    const response=await worker.fetch(f.req,f.env);
    assert.equal(response.status,200);
    const body=await response.json() as {user:{id:number}};
    assert.equal(body.user.id,42);
    assert.ok(!JSON.stringify(body).includes("synthetic"));
    assert.equal(f.deleted(),false);
  } finally {globalThis.fetch=original;}
});
test("temporary token-refresh failure preserves the session for retry",async()=>{
  const f=await fixture(now()+86400, {token:"synthetic", refreshToken:"synthetic-refresh", expiresAt:new Date(0).toISOString(), refreshTokenExpiresAt:new Date(Date.now()+86400000).toISOString()} as {token:string});
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response("Service unavailable",{status:503});
  try { await assert.rejects(session(f.req,f.env), /temporarily unavailable/); assert.equal(f.deleted(),false); }
  finally { globalThis.fetch=original; }
});
test("sign out deletes the session without refreshing GitHub, and is safe to repeat", async () => {
  const f=await fixture(now()-1);
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error("Logout must not call GitHub");};
  try {
    const request=()=>new Request("https://agentlatex.com/api/auth/logout", {method:"POST", headers:{Origin:"https://agentlatex.com", Cookie:"__Host-agentslatex=synthetic-cookie"}});
    const wrongOrigin=await worker.fetch(new Request(request(), {headers:{Origin:"https://elsewhere.example",Cookie:"__Host-agentslatex=synthetic-cookie"}}), f.env);
    assert.equal(wrongOrigin.status,403); assert.equal(f.deleted(),false);
    for (let i=0;i<2;i++) {
      const response=await worker.fetch(request(),f.env);
      assert.equal(response.status,200);
      assert.match(response.headers.get("set-cookie")!, /__Host-agentslatex=;.*Max-Age=0; Secure/);
    }
    assert.equal(f.deleted(),true);
    assert.equal((await worker.fetch(f.req,f.env)).status,401);
  } finally {globalThis.fetch=original;}
});
test("explicit connection always asks GitHub to choose an account", async () => {
  const f=await fixture();
  f.env.APP_ORIGIN="https://agentlatex.com";
  f.env.DB.batch=async()=>[];
  const response=await login(new Request("https://agentlatex.com/api/auth/login"),f.env);
  const redirect=new URL(response.headers.get("location")!);
  assert.equal(redirect.origin,"https://github.com");
  assert.equal(redirect.searchParams.get("prompt"),"select_account");
  assert.equal(redirect.searchParams.get("redirect_uri"),"https://agentlatex.com/api/auth/callback");
  assert.ok(redirect.searchParams.get("state"));
});
test("a stored token that no longer decrypts ends the session cleanly instead of failing every request", async () => {
  const f=await fixture();
  f.row.token="AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error("No GitHub call is needed to reject a damaged session");};
  try {
    await assert.rejects(session(f.req,f.env), e => (e as {status:number}).status===401);
    assert.equal(f.deleted(),true);
    // Identity is still reported until the row is gone; afterwards the client is asked to reconnect.
    assert.equal((await worker.fetch(f.req,f.env)).status,401);
  } finally { globalThis.fetch=original; }
});
test("a concurrent request that already rotated the token is reused rather than refreshed again", async () => {
  const expiring={token:"stale", refreshToken:"consumed", expiresAt:new Date(0).toISOString(), refreshTokenExpiresAt:new Date(Date.now()+86400000).toISOString()};
  const rotated={token:"fresh", refreshToken:"next", expiresAt:new Date(Date.now()+8*3600*1000).toISOString(), refreshTokenExpiresAt:new Date(Date.now()+86400000).toISOString()};
  const row: Session = {id:"synthetic", user_id:42, login:"fixture", expires:now()+86400, refresh_lock:0, token:""};
  let deleted=false, unlocked=0;
  const env = { SESSION_KEY: btoa("a".repeat(32)), GITHUB_CLIENT_ID:"fixture", GITHUB_CLIENT_SECRET:"fixture", GITHUB_APP_SLUG:"fixture",
    DB: { prepare(sql: string) {
      return { bind() { return this; },
        async first() { return deleted ? null : row; },
        async run() {
          if (sql.startsWith("DELETE")) deleted=true;
          // Another request finishes its refresh between our read and our lock.
          if (sql.startsWith("UPDATE sessions SET refresh_lock=?")) { row.refresh_lock=now()+30; row.token=await seal(env, rotated); }
          if (sql.startsWith("UPDATE sessions SET refresh_lock=0")) { row.refresh_lock=0; unlocked++; }
          return {meta:{changes:1}};
        } };
    } }
  } as unknown as Bindings;
  row.token=await seal(env, expiring);
  const original=globalThis.fetch;
  globalThis.fetch=async()=>{throw Error("The consumed refresh token must not be sent to GitHub");};
  try {
    const result=await session(new Request("https://agentlatex.com/api/projects",{headers:{Cookie:"__Host-agentslatex=synthetic-cookie"}}), env);
    assert.equal(result.token,"fresh");
    assert.equal(deleted,false);
    assert.equal(unlocked,1);
    assert.equal(row.refresh_lock,0);
  } finally { globalThis.fetch=original; }
});
