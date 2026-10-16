import { test } from "node:test";
import assert from "node:assert/strict";
import { EMPTY_PROFILE, MAX_STACK, addStack, initialStep, parseProfile, parseStep, type Profile } from "./profile-options.ts";

const full: Profile = {
  name: "  Thiago Cunha  ",
  field: "software_engineering",
  seniority: "mid",
  stack: ["React", "node"],
  status: "active",
  workModels: ["remote"],
  country: "BR",
  contracts: ["clt"],
  currency: "BRL",
  salaryMin: 8000,
  salaryMax: 15000,
};

test("perfil completo passa e sai normalizado", () => {
  const r = parseProfile(full);
  assert.ok(r.ok);
  assert.equal(r.value.name, "Thiago Cunha");
  assert.deepEqual(r.value.stack, ["React", "Node.js"]);
  assert.ok(!("city" in r.value) && !("regions" in r.value) && !("companyTypes" in r.value));
});

test("input que não é objeto falha no primeiro passo", () => {
  assert.deepEqual(parseProfile(null), { ok: false, step: "name", error: "required" });
});

test("nome: só espaços é obrigatório, mais de 80 é longo demais", () => {
  assert.deepEqual(parseStep("name", { name: "   " }), { ok: false, step: "name", error: "required" });
  assert.deepEqual(parseStep("name", { name: "a".repeat(81) }), { ok: false, step: "name", error: "tooLong" });
});

test("escolha única: valor fora da lista é inválido, ausente é obrigatório", () => {
  assert.deepEqual(parseStep("field", { field: "astronaut" }), { ok: false, step: "field", error: "invalid" });
  assert.deepEqual(parseStep("seniority", {}), { ok: false, step: "seniority", error: "required" });
});

test("múltipla vazia é obrigatória, com valor estranho é inválida", () => {
  assert.deepEqual(parseStep("where", { ...full, workModels: [] }), { ok: false, step: "where", error: "required" });
  assert.deepEqual(parseStep("where", { ...full, workModels: ["mars"] }), { ok: false, step: "where", error: "invalid" });
});

test("híbrido ou presencial não pedem cidade", () => {
  assert.ok(parseStep("where", { workModels: ["hybrid", "onsite"], country: "BR" }).ok);
});

test("país: aceita minúsculas, rejeita código inexistente", () => {
  const r = parseStep("where", { ...full, country: "pt" });
  assert.ok(r.ok);
  assert.equal(r.value.country, "PT");
  assert.deepEqual(parseStep("where", { ...full, country: "XX" }), { ok: false, step: "where", error: "invalid" });
});

test("kind: só contrato", () => {
  assert.ok(parseStep("kind", { contracts: ["pj"] }).ok);
  assert.deepEqual(parseStep("kind", { contracts: [] }), { ok: false, step: "kind", error: "required" });
});

test("stack: tira duplicata ignorando maiúsculas e usa o nome canônico", () => {
  const r = parseStep("stack", { stack: ["react", "React", "NodeJS", " node.js ", "Elixir"] });
  assert.ok(r.ok);
  assert.deepEqual(r.value.stack, ["React", "Node.js", "Elixir"]);
});

test("stack: vazia, longa demais e acima do limite", () => {
  assert.deepEqual(parseStep("stack", { stack: ["  "] }), { ok: false, step: "stack", error: "required" });
  assert.deepEqual(parseStep("stack", { stack: ["x".repeat(41)] }), { ok: false, step: "stack", error: "tooLong" });
  const many = Array.from({ length: MAX_STACK + 1 }, (_, i) => `tech${i}`);
  assert.deepEqual(parseStep("stack", { stack: many }), { ok: false, step: "stack", error: "tooMany" });
  assert.deepEqual(parseStep("stack", { stack: "React" }), { ok: false, step: "stack", error: "required" });
});

test("salário: mínimo > máximo, não inteiro, acima do teto, moeda estranha", () => {
  const base = { currency: "BRL", salaryMin: 8000, salaryMax: 15000 };
  assert.deepEqual(parseStep("salary", { ...base, salaryMin: 16000 }), { ok: false, step: "salary", error: "range" });
  assert.deepEqual(parseStep("salary", { ...base, salaryMin: 1.5 }), { ok: false, step: "salary", error: "invalid" });
  assert.deepEqual(parseStep("salary", { ...base, salaryMax: 2_000_000 }), { ok: false, step: "salary", error: "invalid" });
  assert.deepEqual(parseStep("salary", { ...base, currency: "GBP" }), { ok: false, step: "salary", error: "invalid" });
  assert.deepEqual(parseStep("salary", { ...base, salaryMax: null }), { ok: false, step: "salary", error: "required" });
});

test("passo inicial: primeiro incompleto", () => {
  assert.equal(initialStep({ ...EMPTY_PROFILE, name: "A", field: "qa" }), "seniority");
  assert.equal(initialStep(EMPTY_PROFILE), "name");
});

test("passo inicial: ?step= anterior vale, posterior ou lixo não", () => {
  const p = { ...EMPTY_PROFILE, name: "A", field: "qa" as const };
  assert.equal(initialStep(p, "name"), "name");
  assert.equal(initialStep(p, "seniority"), "seniority");
  assert.equal(initialStep(p, "salary"), "seniority");
  assert.equal(initialStep(p, "done"), "seniority");
  assert.equal(initialStep(p, "lixo"), "seniority");
});

test("passo inicial: tudo preenchido vai para o resumo", () => {
  assert.equal(initialStep(full), "done");
  assert.equal(initialStep(full, "stack"), "stack");
});

test("addStack: colar lista, canônico, sem repetir, respeita o limite", () => {
  assert.deepEqual(addStack(["React"], ["react", " go ", "", "SQL"]), ["React", "Go", "SQL"]);
  const thirty = Array.from({ length: MAX_STACK }, (_, i) => `tech${i}`);
  assert.equal(addStack(thirty, ["Rust"]).length, MAX_STACK);
});

test("stack: lista gigante é recusada sem travar o servidor", () => {
  const huge = Array.from({ length: 50_000 }, (_, i) => `tech${i}`);
  const t0 = performance.now();
  assert.deepEqual(parseStep("stack", { stack: huge }), { ok: false, step: "stack", error: "tooMany" });
  assert.ok(performance.now() - t0 < 200, "validação deve rejeitar antes de normalizar");
});
