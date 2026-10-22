import { test } from "node:test";
import assert from "node:assert/strict";
import { AutoRefresh } from "../src/auto-refresh";
import { github, ApiError } from "../worker/github";
import { request, RequestError } from "../src/api";

test("polling respects cadence, visibility, idle state, in-flight checks and disposal", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let visible = true, idle = false, count = 0, finish: () => void = () => {};
  const loop = new AutoRefresh({ visible: () => visible, idle: () => idle, ready: () => true,
    check: () => { count++; return new Promise<void>(resolve => { finish = resolve; }); }, error: () => 0 });
  loop.wake();
  t.mock.timers.tick(29_999); assert.equal(count, 0);
  t.mock.timers.tick(1); assert.equal(count, 1);
  loop.wake(); t.mock.timers.tick(90_000); assert.equal(count, 1);
  visible = false; loop.wake(); finish(); await Promise.resolve();
  t.mock.timers.tick(600_000); assert.equal(count, 1);
  visible = true; idle = true; loop.wake(); t.mock.timers.tick(0); assert.equal(count, 2);
  finish(); await Promise.resolve();
  t.mock.timers.tick(119_999); assert.equal(count, 2);
  t.mock.timers.tick(1); assert.equal(count, 3);
  finish(); await Promise.resolve(); loop.stop();
  t.mock.timers.tick(600_000); assert.equal(count, 3);
});

test("server backoff survives focus/activity events; access errors stop polling", async t => {
  t.mock.timers.enable({ apis: ["setTimeout", "Date"], now: 0 });
  let count = 0;
  const loop = new AutoRefresh({ visible: () => true, idle: () => false, ready: () => true,
    check: async () => { count++; throw new Error("limited"); }, error: () => count === 1 ? 180_000 : false });
  loop.wake(); t.mock.timers.tick(30_000); await Promise.resolve(); assert.equal(count, 1);
  for (let i = 0; i < 5; i++) { loop.wake(); t.mock.timers.tick(30_000); await Promise.resolve(); }
  assert.equal(count, 1);
  t.mock.timers.tick(30_000); await Promise.resolve(); assert.equal(count, 2);
  loop.wake(); t.mock.timers.tick(1_000_000); assert.equal(count, 2);
});

test("rate-limit retry timing travels from GitHub errors to the browser", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ message: "Slow down" }, { status: 403, headers: { "Retry-After": "180" } });
  try {
    await assert.rejects(github("test-token", "/repositories/123"), e =>
      e instanceof ApiError && e.status === 429 && e.retryAfterSeconds >= 180);
    globalThis.fetch = async () => Response.json({ error: "Slow down" }, { status: 429, headers: { "Retry-After": "180" } });
    await assert.rejects(request("/projects/123/head", {}, false), e =>
      e instanceof RequestError && e.status === 429 && e.retryAfterMs === 180_000);
  } finally { globalThis.fetch = original; }
});
