import { test } from "node:test";
import assert from "node:assert/strict";
import { getRedis } from "./redis.ts";

test("Redis fora do ar rejeita rápido, e a chamada seguinte conecta quando ele volta", async () => {
  const real = process.env.REDIS_URL ?? "redis://localhost:5113";
  process.env.REDIS_URL = "redis://localhost:1"; // porta sem ninguém ouvindo
  const t0 = performance.now();
  await assert.rejects(getRedis());
  assert.ok(performance.now() - t0 < 3000, "não pode ficar tentando para sempre (fail-closed)");

  process.env.REDIS_URL = real;
  const r = await getRedis();
  assert.equal(await r.ping(), "PONG");
  await r.quit();
});
