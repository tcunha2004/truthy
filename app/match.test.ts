import { test } from "node:test";
import assert from "node:assert/strict";
import { matchAll, matchInput, matchPrefix, normalizeMatch, stripHtml, type Match, type MatchDeps, type MatchJob } from "./match.ts";
import { EMPTY_PROFILE, type Profile } from "./profile-options.ts";

const p: Profile = {
  ...EMPTY_PROFILE, name: "Ana", field: "software_engineering", seniority: "senior", stack: ["Go", "PostgreSQL"],
  status: "active", workModels: ["remote"], country: "BR", contracts: ["pj"], currency: "BRL", salaryMin: 15000, salaryMax: 20000,
};
const job: MatchJob = {
  id: "7", title: "Senior Backend Engineer", company: "Twilio", description: "<p>Go &amp; <b>Kubernetes</b></p>",
  seniority: "senior", stack: ["Go", "Kubernetes"], location: "Remote, LATAM", isRemote: true, countries: ["BR", "AR"],
};
const m: Match = { score: 7.5, matching: ["Go"], missing: ["Kubernetes"] };

test("stripHtml tira tags, decodifica entidades e junta espaços", () => {
  assert.equal(stripHtml("<p>Go &amp; <b>Kubernetes</b></p>\n\n<li>AWS&nbsp;&lt;3&gt;</li>"), "Go & Kubernetes AWS <3>");
});

test("normalizeMatch: limita a nota e arredonda", () => {
  assert.equal(normalizeMatch({ score: 14, matching: [], missing: [] })!.score, 10);
  assert.equal(normalizeMatch({ score: -2, matching: [], missing: [] })!.score, 0);
  assert.equal(normalizeMatch({ score: 7.46, matching: [], missing: [] })!.score, 7.5);
});

test("normalizeMatch: listas aparadas, sem vazios, sem duplicadas (caixa), no máximo 6, itens até 60 caracteres", () => {
  const long = "x".repeat(80);
  const r = normalizeMatch({ score: 5, matching: [" Go ", "go", "", "  ", "A", "B", "C", "D", "E", "F"], missing: [long] })!;
  assert.deepEqual(r.matching, ["Go", "A", "B", "C", "D", "E"]);
  assert.equal(r.missing[0].length, 60);
});

test("normalizeMatch: forma errada vira null", () => {
  assert.equal(normalizeMatch("oi"), null);
  assert.equal(normalizeMatch(null), null);
  assert.equal(normalizeMatch({ matching: [], missing: [] }), null); // sem score
  assert.equal(normalizeMatch({ score: Number.NaN, matching: [], missing: [] }), null);
  assert.deepEqual(normalizeMatch({ score: 5, matching: "Go", missing: [1, "AWS"] }), { score: 5, matching: [], missing: ["AWS"] });
});

test("matchPrefix muda com perfil e idioma, e não com o nome", () => {
  const a = matchPrefix("pt", p);
  assert.match(a, /^match:v1:pt:[0-9a-f]{64}:$/);
  assert.equal(matchPrefix("pt", { ...p, name: "Outro" }), a);
  assert.notEqual(matchPrefix("en", p), a);
  assert.notEqual(matchPrefix("pt", { ...p, stack: ["Go"] }), a);
  assert.notEqual(matchPrefix("pt", { ...p, seniority: "mid" }), a);
});

test("matchInput: perfil e vaga, descrição limpa e cortada, idioma pedido", () => {
  const s = matchInput("pt", p, { ...job, description: "<p>" + "a".repeat(5000) + "</p>" });
  assert.match(s, /Senior Backend Engineer/);
  assert.match(s, /Twilio/);
  assert.match(s, /Software Engineering/);
  assert.match(s, /Go, PostgreSQL/);
  assert.match(s, /Portuguese/);
  assert.ok(!s.includes("<p>"));
  assert.ok(!s.includes("a".repeat(4001)));
  assert.ok(!s.includes("Ana")); // nome não vai para o modelo
});

test("matchInput: campos ausentes ficam de fora", () => {
  const s = matchInput("en", { ...p, salaryMin: null, salaryMax: null, currency: null, contracts: [] },
    { ...job, description: null, stack: null, location: null, isRemote: null, countries: null, seniority: null });
  assert.match(s, /English/);
  assert.ok(!/Description:/.test(s));
  assert.ok(!/Salary/.test(s));
  assert.ok(!/null|undefined/.test(s));
});

// Deps falsas que contam chamadas.
function fake(over: Partial<MatchDeps> & { cache?: Record<string, string> } = {}) {
  const calls = { take: 0, analyze: [] as string[], jobs: [] as string[][], save: [] as string[] };
  const cache = over.cache ?? {};
  const deps: MatchDeps = {
    mget: over.mget ?? (async (keys) => keys.map((k) => cache[k] ?? null)),
    take: over.take ?? (async () => { calls.take++; return { ok: true }; }),
    jobs: over.jobs ?? (async (ids) => { calls.jobs.push(ids); return ids.map((id) => ({ ...job, id })); }),
    analyze: over.analyze ?? (async (j) => { calls.analyze.push(j.id); return m; }),
    save: over.save ?? (async (k) => { calls.save.push(k); }),
  };
  return { deps, calls };
}
const settle = async (map: Map<string, Promise<unknown>>) => Object.fromEntries(await Promise.all([...map].map(async ([k, v]) => [k, await v])));

test("matchAll: tudo em cache → não chama take nem o modelo", async () => {
  const { deps, calls } = fake({ cache: { "P:1": JSON.stringify(m), "P:2": JSON.stringify(m) } });
  const out = await settle(matchAll(["1", "2"], "P:", deps));
  assert.deepEqual(out, { 1: { kind: "ok", match: m }, 2: { kind: "ok", match: m } });
  assert.equal(calls.take, 0);
  assert.deepEqual(calls.analyze, []);
});

test("matchAll: só as que faltam vão ao modelo, take uma vez, sucesso é salvo", async () => {
  const { deps, calls } = fake({ cache: { "P:1": JSON.stringify(m) } });
  const out = await settle(matchAll(["1", "2", "3"], "P:", deps));
  assert.equal(out[1].kind, "ok");
  assert.equal(out[3].kind, "ok");
  assert.equal(calls.take, 1);
  assert.deepEqual(calls.jobs, [["2", "3"]]);
  assert.deepEqual(calls.analyze.sort(), ["2", "3"]);
  assert.deepEqual(calls.save.sort(), ["P:2", "P:3"]);
});

test("matchAll: limite estourado → cacheadas ok, resto limited com minutos, modelo não chamado", async () => {
  const { deps, calls } = fake({ cache: { "P:1": JSON.stringify(m) }, take: async () => ({ ok: false, minutes: 12 }) });
  const out = await settle(matchAll(["1", "2"], "P:", deps));
  assert.deepEqual(out, { 1: { kind: "ok", match: m }, 2: { kind: "limited", minutes: 12 } });
  assert.deepEqual(calls.analyze, []);
});

test("matchAll: mget falhando → todas unavailable, nada chamado", async () => {
  const { deps, calls } = fake({ mget: async () => { throw new Error("redis down"); } });
  const out = await settle(matchAll(["1", "2"], "P:", deps));
  assert.deepEqual(out, { 1: { kind: "unavailable" }, 2: { kind: "unavailable" } });
  assert.equal(calls.take, 0);
  assert.deepEqual(calls.analyze, []);
});

test("matchAll: take falhando (Redis caiu no meio) → as que faltam unavailable", async () => {
  const { deps } = fake({ cache: { "P:1": JSON.stringify(m) }, take: async () => { throw new Error("redis down"); } });
  const out = await settle(matchAll(["1", "2"], "P:", deps));
  assert.deepEqual(out, { 1: { kind: "ok", match: m }, 2: { kind: "unavailable" } });
});

test("matchAll: uma análise falha → só ela unavailable, e não é salva", async () => {
  const { deps, calls } = fake({ analyze: async (j) => { if (j.id === "2") throw new Error("timeout"); return m; } });
  const out = await settle(matchAll(["1", "2"], "P:", deps));
  assert.equal(out[1].kind, "ok");
  assert.deepEqual(out[2], { kind: "unavailable" });
  assert.deepEqual(calls.save, ["P:1"]);
});

test("matchAll: vaga sumiu do banco → unavailable; cache corrompido conta como ausente", async () => {
  const { deps, calls } = fake({ cache: { "P:1": "{lixo" }, jobs: async () => [] });
  const out = await settle(matchAll(["1"], "P:", deps));
  assert.deepEqual(out, { 1: { kind: "unavailable" } });
  assert.equal(calls.take, 1);
});

test("matchAll: save falhando não derruba o resultado", async () => {
  const { deps } = fake({ save: async () => { throw new Error("redis down"); } });
  const out = await settle(matchAll(["1"], "P:", deps));
  assert.equal(out[1].kind, "ok");
});
