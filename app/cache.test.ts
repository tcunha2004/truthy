import { test } from "node:test";
import assert from "node:assert/strict";
import { cached } from "./cache.ts";

test("mesma chave chama a função uma vez só", async () => {
  let calls = 0;
  const get = cached(async (k) => { calls++; return `v:${k}`; }, 10);
  assert.equal(await get("react"), "v:react");
  assert.equal(await get("react"), "v:react");
  assert.equal(calls, 1);
});

test("null não fica no cache", async () => {
  let calls = 0;
  const get = cached(async () => { calls++; return null; }, 10);
  await get("react");
  await get("react");
  assert.equal(calls, 2);
});

test("passando do limite, a entrada mais antiga sai", async () => {
  const seen: string[] = [];
  const get = cached(async (k) => { seen.push(k); return k; }, 2);
  await get("a");
  await get("b");
  await get("c"); // tira "a"
  await get("b"); // ainda no cache
  await get("a"); // chama de novo
  assert.deepEqual(seen, ["a", "b", "c", "a"]);
});
