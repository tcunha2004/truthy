import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password.ts";

test("hash tem o formato scrypt com 6 campos e a senha certa verifica", async () => {
  const hash = await hashPassword("segredo123");
  assert.equal(hash.split("$").length, 6);
  assert.ok(hash.startsWith("scrypt$16384$8$1$"));
  assert.equal(await verifyPassword("segredo123", hash), true);
});

test("senha errada falha", async () => {
  const hash = await hashPassword("segredo123");
  assert.equal(await verifyPassword("outra-senha", hash), false);
});

test("mesma senha gera hashes diferentes (salt)", async () => {
  assert.notEqual(await hashPassword("segredo123"), await hashPassword("segredo123"));
});

test("senha com acentos e emoji verifica", async () => {
  const hash = await hashPassword("sénha-çãõ-🔑");
  assert.equal(await verifyPassword("sénha-çãõ-🔑", hash), true);
  assert.equal(await verifyPassword("senha-cao-🔑", hash), false);
});

test("hash null ou corrompido devolve false sem lançar", async () => {
  assert.equal(await verifyPassword("x", null), false);
  assert.equal(await verifyPassword("x", "lixo"), false);
  assert.equal(await verifyPassword("x", "scrypt$1$1$1$a$b"), false);
});

test("null gasta tempo de scrypt de verdade", async () => {
  const t0 = performance.now();
  await verifyPassword("x", null);
  assert.ok(performance.now() - t0 > 5);
});
