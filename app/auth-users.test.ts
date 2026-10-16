import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { Pool } from "pg";
import { createClient } from "redis";
import { logIn, signUp, upsertGoogleUser, type Deps } from "./auth-users.ts";

// Precisa do Postgres e do Redis do docker compose no ar.
const db = new Pool({ connectionString: process.env.DATABASE_URL ?? "postgres://truthy:truthy@localhost:5112/truthy" });
const redis = createClient({ url: process.env.REDIS_URL ?? "redis://localhost:5113" });
const deps: Deps = { db, redis };
before(() => redis.connect());
after(async () => {
  await db.query(`DELETE FROM users WHERE email LIKE '%@auth-test.invalid'`);
  await db.end();
  await redis.quit();
});

const rnd = () => randomBytes(4).toString("hex");
const email = () => `u${rnd()}@auth-test.invalid`;
const ip = () => `ip-${rnd()}`;
const PW = "segredo123";
const signup = (e: string, over: Partial<{ name: string; password: string; ip: string }> = {}) =>
  signUp(deps, { name: "Ana", email: e, password: PW, ip: ip(), ...over });
const login = (e: string, password = PW, i = ip()) => logIn(deps, { email: e, password, ip: i });
const row = async (e: string) => (await db.query(`SELECT * FROM users WHERE email = $1`, [e])).rows[0];

test("cadastro cria conta de senha e login funciona", async () => {
  const e = email();
  const s = await signup(e);
  assert.equal(s.ok, true);
  const u = await row(e);
  assert.ok(u.password_hash);
  assert.equal(u.google_sub, null);
  assert.deepEqual(await login(e), { ok: true, userId: u.id, onboarded: false });
});

test("e-mail com maiúsculas e espaços é a mesma conta", async () => {
  const e = email();
  assert.equal((await signup(`  ${e.toUpperCase()} `)).ok, true);
  assert.equal((await login(e)).ok, true);
  assert.deepEqual(await signup(e), { ok: false, error: "exists" });
});

test("cadastro com e-mail existente dá exists: senha, Google e apagada", async () => {
  const a = email();
  await signup(a);
  assert.deepEqual(await signup(a), { ok: false, error: "exists" });
  const g = email();
  await db.query(`INSERT INTO users (email, google_sub) VALUES ($1, $2)`, [g, `sub-${rnd()}`]);
  assert.deepEqual(await signup(g), { ok: false, error: "exists" });
  const d = email();
  await db.query(`INSERT INTO users (email, google_sub, deleted_at) VALUES ($1, $2, now())`, [d, `sub-${rnd()}`]);
  assert.deepEqual(await signup(d), { ok: false, error: "exists" });
});

test("dois cadastros simultâneos do mesmo e-mail: um ok, um exists", async () => {
  const e = email();
  const results = await Promise.all([signup(e), signup(e)]);
  const kinds = results.map((r) => (r.ok ? "ok" : r.error)).sort();
  assert.deepEqual(kinds, ["exists", "ok"]);
});

test("validação do cadastro", async () => {
  assert.deepEqual(await signup(email(), { password: "1234567" }), { ok: false, error: "invalid" });
  assert.deepEqual(await signup(email(), { password: "x".repeat(129) }), { ok: false, error: "invalid" });
  assert.equal((await signup(email(), { password: "x".repeat(128) })).ok, true);
  assert.deepEqual(await signup(email(), { name: "" }), { ok: false, error: "invalid" });
  assert.deepEqual(await signup(email(), { name: "   " }), { ok: false, error: "invalid" });
  assert.deepEqual(await signup(email(), { name: "n".repeat(101) }), { ok: false, error: "invalid" });
  assert.deepEqual(await signup("sem-arroba"), { ok: false, error: "invalid" });
});

test("login: senha errada, e-mail inexistente, conta Google e conta apagada dão credentials", async () => {
  const e = email();
  await signup(e);
  const g = email();
  await db.query(`INSERT INTO users (email, google_sub) VALUES ($1, $2)`, [g, `sub-${rnd()}`]);
  const d = email();
  await signup(d);
  await db.query(`UPDATE users SET deleted_at = now() WHERE email = $1`, [d]);
  const bad = { ok: false, error: "credentials" };
  assert.deepEqual(await login(e, "senha-errada"), bad);
  assert.deepEqual(await login(email()), bad);
  assert.deepEqual(await login(g), bad);
  assert.deepEqual(await login(d), bad);
});

test("login: 5 falhas bloqueiam o e-mail e o 6º nem autentica", async () => {
  const e = email();
  await signup(e);
  for (let i = 0; i < 5; i++) assert.deepEqual(await login(e, "errada"), { ok: false, error: "credentials" });
  assert.deepEqual(await login(e), { ok: false, error: "rate" });
});

test("login: sucesso zera o contador do e-mail", async () => {
  const e = email();
  await signup(e);
  for (let i = 0; i < 4; i++) await login(e, "errada");
  assert.equal((await login(e)).ok, true);
  for (let i = 0; i < 4; i++) assert.deepEqual(await login(e, "errada"), { ok: false, error: "credentials" });
});

test("login: 20 falhas do mesmo IP em e-mails diferentes bloqueiam o IP", async () => {
  const i = ip();
  for (let n = 0; n < 20; n++) await login(email(), "errada", i);
  assert.deepEqual(await login(email(), "errada", i), { ok: false, error: "rate" });
});

test("cadastro: 10 tentativas por IP e a 11ª dá rate", async () => {
  const i = ip();
  for (let n = 0; n < 10; n++) await signup(email(), { ip: i });
  assert.deepEqual(await signup(email(), { ip: i }), { ok: false, error: "rate" });
});

test("upsertGoogleUser: conta nova, conta Google existente e conta de senha", async () => {
  const e = email();
  const sub = `sub-${rnd()}`;
  const first = await upsertGoogleUser(db, { sub, email: e, name: "Gabi" });
  assert.ok(first);
  assert.equal(first.onboarded, false);
  const again = await upsertGoogleUser(db, { sub, email: e });
  assert.equal(again?.userId, first.userId);

  const p = email();
  await signup(p);
  assert.equal(await upsertGoogleUser(db, { sub: `sub-${rnd()}`, email: p }), null);
  const u = await row(p);
  assert.equal(u.google_sub, null);
});

test("upsertGoogleUser: nome editado não é sobrescrito", async () => {
  const e = email();
  const sub = `sub-${rnd()}`;
  await upsertGoogleUser(db, { sub, email: e, name: "Original" });
  await db.query(`UPDATE users SET name = 'Editado' WHERE email = $1`, [e]);
  await upsertGoogleUser(db, { sub, email: e, name: "Outro" });
  assert.equal((await row(e)).name, "Editado");
});
