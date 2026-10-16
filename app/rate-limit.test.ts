import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createClient } from "redis";
import { clear, clientIp, limits, refund, take } from "./rate-limit.ts";

// Precisa do Redis do docker compose no ar.
const r = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:5113" });
before(() => r.connect());
after(() => r.quit());

const key = () => `rl:test:${randomBytes(4).toString("hex")}`;
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

test("libera até o máximo e nega a partir daí", async () => {
  const limit = { key: key(), max: 3, windowSec: 60 };
  assert.deepEqual([await take(r, limit), await take(r, limit), await take(r, limit)], [true, true, true]);
  assert.equal(await take(r, limit), false);
});

test("requisições em paralelo não passam do máximo", async () => {
  const limit = { key: key(), max: 5, windowSec: 60 };
  const results = await Promise.all(Array.from({ length: 20 }, () => take(r, limit)));
  assert.equal(results.filter(Boolean).length, 5);
});

test("clear zera a contagem", async () => {
  const limit = { key: key(), max: 1, windowSec: 60 };
  assert.equal(await take(r, limit), true);
  assert.equal(await take(r, limit), false);
  await clear(r, limit.key);
  assert.equal(await take(r, limit), true);
});

test("refund devolve a tentativa", async () => {
  const limit = { key: key(), max: 1, windowSec: 60 };
  assert.equal(await take(r, limit), true);
  await refund(r, limit.key);
  assert.equal(await take(r, limit), true);
});

test("refund numa chave que não existe não cria chave", async () => {
  const k = key();
  await refund(r, k);
  assert.equal(await r.exists(k), 0);
});

test("refund não deixa a contagem negativa", async () => {
  const limit = { key: key(), max: 5, windowSec: 60 };
  await take(r, limit);
  await refund(r, limit.key);
  await refund(r, limit.key);
  assert.equal(await r.get(limit.key), "0");
});

test("a chave expira com a janela", async () => {
  const limit = { key: key(), max: 1, windowSec: 1 };
  await take(r, limit);
  assert.equal(await take(r, limit), false);
  await sleep(1100);
  assert.equal(await take(r, limit), true);
});

test("a janela não renova a cada tentativa", async () => {
  const limit = { key: key(), max: 99, windowSec: 5 };
  await take(r, limit);
  await sleep(1100);
  await take(r, limit);
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
