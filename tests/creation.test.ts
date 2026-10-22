import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../worker/index";
import { seal, type Bindings, type Session } from "../worker/auth";

async function fixture() {
  const row: Session = { id: "test", user_id: 42, login: "fixture", token: "", expires: Math.floor(Date.now()/1000)+86400, refresh_lock: 0 };
  let project: Record<string, unknown> | null = null;
  let registered = 0;
  const env = { SESSION_KEY: btoa("a".repeat(32)), DB: { prepare(sql: string) {
    let values: unknown[] = [];
    return { bind(...args: unknown[]) { values = args; return this; },
      async first() {
        if (sql.startsWith("SELECT * FROM sessions")) return row;
        if (sql.includes("FROM creations")) return null;
        if (sql.includes("FROM projects")) return project;
        throw Error(sql);
      },
      async run() {
        if (sql.startsWith("INSERT INTO projects")) {
          registered++;
          const [repo_id, owner, name, branch, main, engine] = values;
          project = { repo_id, owner, name, branch, main, engine };
        }
        return {meta:{changes:1}};
      },
    };
  }}} as unknown as Bindings;
  row.token = await seal(env, {token:"synthetic"});
  const call = (path: string, data?: unknown) => worker.fetch(new Request(`https://agentlatex.com/api/${path}`, {
    method:data === undefined ? "GET" : "POST", headers:{Origin:"https://agentlatex.com",Cookie:"__Host-agentslatex=synthetic","Content-Type":"application/json"}, body:JSON.stringify(data),
  }), env);
  return {call, registered:()=>registered};
}

test("GitHub creation denied before installation gives a recoverable setup response", async () => {
  const f = await fixture(); const original = globalThis.fetch;
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://api.github.com/user/repos");
    assert.equal(init?.method,"POST");
    assert.equal(JSON.parse(String(init?.body)).private,true);
    return Response.json({message:"Resource not accessible by integration"},{status:403});
  };
  try {
    const r = await f.call("projects",{name:"first-paper",requestId:"00000000-0000-4000-8000-000000000001"});
    assert.equal(r.status,403);
    assert.equal((await r.json() as {code:string}).code,"repository_creation_setup");
    assert.equal(f.registered(),0);
  } finally {globalThis.fetch=original;}
});

for (const scenario of ["success", "retry after starter failure", "concurrent initialization", "first commit visibility delay"] as const) {
  test(`empty repository setup: ${scenario}`, async () => {
    const f = await fixture(); const original = globalThis.fetch;
    let initialized = false, seeds = 0, commits = 0;
    let delayedReads = scenario === "first commit visibility delay" ? 1 : 0;
    let failStarter = scenario === "retry after starter failure";
    const paths: string[] = [];
    const repo = {id:7,full_name:"fixture/empty-paper",name:"empty-paper",owner:{login:"fixture"},private:true,default_branch:"main",permissions:{push:true},html_url:"https://github.com/fixture/empty-paper"};
    const sha = "a".repeat(40), next = "b".repeat(40);
    globalThis.fetch = async (url, init) => {
      const p = new URL(String(url)).pathname;
      if (p === "/repositories/7") return Response.json(repo);
      if (p.includes("/git/ref/")) {
        const visible = initialized && delayedReads-- <= 0;
        return visible ? Response.json({object:{sha}}) : Response.json({message:"Git Repository is empty."},{status:409});
      }
      if (p.endsWith("/contents/README.md")) {
        assert.equal(init?.method,"PUT");
        const body = JSON.parse(String(init?.body));
        assert.equal(body.branch,"main"); assert.ok(!("sha" in body));
        assert.match(atob(body.content), /agentlatex\/main\/main\.tex/);
        seeds++; initialized = true;
        return scenario === "concurrent initialization" ? Response.json({message:'"sha" wasn’t supplied.'},{status:422}) : Response.json({},{status:201});
      }
      if (p.endsWith("/git/commits/"+sha)) return Response.json({tree:{sha}});
      if (p.endsWith("/git/trees/"+sha)) return Response.json({tree:[{path:"README.md",sha,size:12,mode:"100644",type:"blob"}],truncated:false});
      if (p.endsWith("/git/blobs")) {
        if (failStarter) {failStarter = false;return Response.json({message:"Temporary GitHub failure"},{status:503});}
        return Response.json({sha:next});
      }
      if (p.endsWith("/git/trees")) {
        const body = JSON.parse(String(init?.body)); assert.equal(body.base_tree,sha);
        paths.push(...body.tree.map((entry:{path:string})=>entry.path));return Response.json({sha:next});
      }
      if (p.endsWith("/git/commits")) {commits++;return Response.json({sha:next});}
      if (p.includes("/git/refs/")) {assert.equal(JSON.parse(String(init?.body)).force,false);return Response.json({});}
      throw Error(p);
    };
    try {
      const browse = await f.call("repositories/7/files");
      assert.equal(browse.status,200); assert.deepEqual(await browse.json(),{revision:null,tree:null,files:[]});
      assert.equal(seeds,0); assert.equal(f.registered(),0);
      const invalid = await f.call("connect",{repositoryId:7,folder:"agentlatex/main",main:"agentlatex/main/missing.tex"});
      assert.equal(invalid.status,400); assert.equal(seeds,0);
      let r = await f.call("connect",{repositoryId:7,folder:"agentlatex/main"});
      if (scenario === "retry after starter failure") {
        assert.equal(r.status,503); assert.equal(seeds,1); assert.equal(f.registered(),0);
        r = await f.call("connect",{repositoryId:7,folder:"agentlatex/main"});
      }
      assert.equal(r.status,200); assert.equal((await r.json() as {id:number}).id,7);
      assert.equal((await f.call("connect",{repositoryId:7,folder:"agentlatex/main"})).status,200);
      assert.equal(seeds,1); assert.equal(commits,1); assert.equal(f.registered(),1);
      assert.ok(paths.includes(".agentlatex.json")); assert.ok(paths.includes("agentlatex/main/main.tex"));
      assert.ok(!paths.includes("README.md"));
    } finally {globalThis.fetch=original;}
  });
}

test("connecting the new repository requires GitHub access, initializes once, and preserves README", async () => {
  const f = await fixture(); const original = globalThis.fetch;
  let authorized = false, commits = 0; const paths: string[] = [];
  const repo = {id:7,full_name:"fixture/first-paper",name:"first-paper",owner:{login:"fixture"},private:true,default_branch:"main",permissions:{push:true},html_url:"https://github.com/fixture/first-paper"};
  const sha = "a".repeat(40), next = "b".repeat(40);
  globalThis.fetch = async (url, init) => {
    const p = new URL(String(url)).pathname;
    if (p === "/repositories/7") return authorized ? Response.json(repo) : Response.json({message:"Resource not accessible by integration"},{status:403});
    assert.equal(authorized,true);
    if (p.includes("/git/ref/")) return Response.json({object:{sha}});
    if (p.endsWith("/git/commits/"+sha)) return Response.json({tree:{sha}});
    if (p.endsWith("/git/trees/"+sha)) return Response.json({tree:[{path:"README.md",sha,size:12,mode:"100644",type:"blob"}],truncated:false});
    if (p.endsWith("/git/blobs")) return Response.json({sha:next});
    if (p.endsWith("/git/trees")) {
      const body=JSON.parse(String(init?.body)); assert.equal(body.base_tree,sha);
      paths.push(...body.tree.map((f:{path:string})=>f.path)); return Response.json({sha:next});
    }
    if (p.endsWith("/git/commits")) {commits++;return Response.json({sha:next});}
    if (p.includes("/git/refs/")) {assert.equal(JSON.parse(String(init?.body)).force,false);return Response.json({});}
    throw Error(p);
  };
  try {
    let r = await f.call("connect",{repositoryId:7,folder:"agentlatex/main"});
    assert.equal(r.status,403); assert.equal(commits,0); assert.equal(f.registered(),0);
    authorized=true;
    for (let i=0;i<2;i++) {
      r=await f.call("connect",{repositoryId:7,folder:"agentlatex/main"});
      assert.ok(r.ok); assert.equal((await r.json() as {id:number}).id,7);
    }
    assert.equal(commits,1); assert.equal(f.registered(),1);
    assert.ok(paths.includes(".agentlatex.json")); assert.ok(paths.includes("agentlatex/main/main.tex"));
    assert.ok(paths.includes("AGENTS.md")); assert.ok(!paths.includes("README.md"));
  } finally {globalThis.fetch=original;}
});
