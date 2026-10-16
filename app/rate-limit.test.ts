import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createClient } from "redis";
import { blocked, clear, clientIp, hit, limits } from "./rate-limit.ts";

// Precisa do Redis do docker compose no ar.
const r = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:5113" });
before(() => r.connect());
after(() => r.quit());

const key = () => `rl:test:${randomBytes(4).toString("hex")}`;
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

test("bloqueia ao chegar no máximo", async () => {
  const limit = { key: key(), max: 3, windowSec: 60 };
  await hit(r, limit);
  await hit(r, limit);
  assert.equal(await blocked(r, limit), false);
  await hit(r, limit);
  assert.equal(await blocked(r, limit), true);
});

test("clear zera a contagem", async () => {
  const limit = { key: key(), max: 1, windowSec: 60 };
  await hit(r, limit);
  assert.equal(await blocked(r, limit), true);
  await clear(r, limit.key);
  assert.equal(await blocked(r, limit), false);
});

test("a chave expira com a janela", async () => {
  const limit = { key: key(), max: 1, windowSec: 1 };
  await hit(r, limit);
  assert.equal(await blocked(r, limit), true);
  await sleep(1100);
  assert.equal(await blocked(r, limit), false);
});

test("a janela não renova a cada hit", async () => {
  const limit = { key: key(), max: 99, windowSec: 5 };
  await hit(r, limit);
  await sleep(1100);
  await hit(r, limit);
  assert.ok((await r.ttl(limit.key)) <= 4);
});

test("clientIp pega o primeiro IP e cai em unknown", () => {
  assert.equal(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), "1.2.3.4");
  assert.equal(clientIp(new Headers({ "x-forwarded-for": " 9.9.9.9 " })), "9.9.9.9");
  assert.equal(clientIp(new Headers()), "unknown");
});

test("limits tem os números da spec", () => {
  assert.deepEqual(limits.loginEmail("a@b.c"), { key: "rl:login:email:a@b.c", max: 5, windowSec: 900 });
  assert.deepEqual(limits.loginIp("x"), { key: "rl:login:ip:x", max: 20, windowSec: 900 });
  assert.deepEqual(limits.signupIp("x"), { key: "rl:signup:ip:x", max: 10, windowSec: 3600 });
});
