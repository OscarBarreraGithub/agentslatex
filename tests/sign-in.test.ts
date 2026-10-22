import { test } from "node:test";
import assert from "node:assert/strict";
import { checkSignIn } from "../src/sign-in";
import { RequestError } from "../src/api";

test("a network failure and temporary server error recover without another click", async () => {
  const original = globalThis.fetch;
  let calls = 0, retries = 0;
  globalThis.fetch = async (_url, init) => {
    assert.ok(init?.signal);
    calls++;
    if (calls === 1) throw new TypeError("Failed to fetch");
    if (calls === 2) return Response.json({error:"Temporarily unavailable"}, {status:503});
    return Response.json({user:{id:42,login:"fixture"},installUrl:"https://github.com"});
  };
  try {
    const me = await checkSignIn(() => retries++);
    assert.equal(me.user.id,42); assert.equal(calls,3); assert.equal(retries,2);
  } finally {globalThis.fetch=original;}
});

test("signed-out users go directly to connection, without retrying authentication", async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch=async()=>{calls++; return Response.json({error:"Connect to GitHub"},{status:401});};
  try {
    await assert.rejects(checkSignIn(),e=>e instanceof RequestError && e.status===401);
    assert.equal(calls,1);
  } finally {globalThis.fetch=original;}
});

test("persistent failures stop after bounded retries instead of looping forever", async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch=async()=>{calls++; return Response.json({error:"Unavailable"},{status:502});};
  try {
    await assert.rejects(checkSignIn(),e=>e instanceof RequestError && e.status===502);
    assert.equal(calls,4);
  } finally {globalThis.fetch=original;}
});

test("long server backoffs are respected without repeated requests", async () => {
  const original = globalThis.fetch; let calls=0;
  globalThis.fetch=async()=>{calls++; return Response.json({error:"Rate limited"},{status:429,headers:{"Retry-After":"120"}});};
  try {
    await assert.rejects(checkSignIn(),e=>e instanceof RequestError && e.retryAfterMs===120_000);
    assert.equal(calls,1);
  } finally {globalThis.fetch=original;}
});
