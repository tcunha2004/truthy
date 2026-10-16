import { test } from "node:test";
import assert from "node:assert/strict";
import { forYouFilters, forYouQuery, forYouScope, forYouStack } from "./for-you.ts";
import { EMPTY_PROFILE, type Profile } from "./profile-options.ts";

const p: Profile = {
  ...EMPTY_PROFILE, name: "Ana", field: "software_engineering", seniority: "junior", stack: ["Node.js", "TypeScript"],
  status: "active", workModels: ["remote"], country: "BR", contracts: ["clt"], currency: "BRL", salaryMin: 5000, salaryMax: 8000,
};

test("forYouQuery: área, nível e stack, em inglês", () => {
  assert.equal(forYouQuery(p), "Software Engineering Junior Node.js TypeScript");
  assert.equal(forYouQuery({ ...p, seniority: "mid" }), "Software Engineering Mid-level Node.js TypeScript");
});

test("forYouQuery: stack de 30 itens entra inteira", () => {
  const stack = Array.from({ length: 30 }, (_, i) => `T${i}`);
  assert.equal(forYouQuery({ ...p, stack }).split(" ").length, 3 + 30); // "Software", "Engineering", "Junior" + 30
});

test("forYouFilters: modelos de trabalho viram remoto/local", () => {
  assert.deepEqual(forYouFilters(p), { seniority: "junior", country: "BR", remote: true, local: false });
  assert.deepEqual(forYouFilters({ ...p, workModels: ["hybrid"] }), { seniority: "junior", country: "BR", remote: false, local: true });
  assert.deepEqual(forYouFilters({ ...p, workModels: ["remote", "onsite"] }), { seniority: "junior", country: "BR", remote: true, local: true });
});

test("forYouScope", () => {
  assert.equal(forYouScope(forYouFilters(p)), "remote");
  assert.equal(forYouScope(forYouFilters({ ...p, workModels: ["onsite"] })), "local");
  assert.equal(forYouScope(forYouFilters({ ...p, workModels: ["remote", "hybrid"] })), "both");
});

test("forYouStack corta em 6", () => {
  const stack = Array.from({ length: 30 }, (_, i) => `T${i}`);
  assert.deepEqual(forYouStack(stack), { shown: stack.slice(0, 6), more: 24 });
  assert.deepEqual(forYouStack(["a", "b"]), { shown: ["a", "b"], more: 0 });
});
