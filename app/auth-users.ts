import type { Pool } from "pg";
import { PASSWORD_MAX, PASSWORD_MIN, hashPassword, verifyPassword } from "./password.ts";
import { blocked, clear, hit, limits, type RateStore } from "./rate-limit.ts";

export type Deps = { db: Pick<Pool, "query">; redis: RateStore };

export type SignUpResult = { ok: true; userId: string } | { ok: false; error: "invalid" | "exists" | "rate" };
export type LogInResult = { ok: true; userId: string; onboarded: boolean } | { ok: false; error: "credentials" | "rate" };

const ONBOARDED = `EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = users.id AND p.onboarded_at IS NOT NULL)`;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isUniqueViolation = (err: unknown) => (err as { code?: string })?.code === "23505";

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function signUp(
  deps: Deps,
  input: { name: string; email: string; password: string; ip: string },
): Promise<SignUpResult> {
  const { db, redis } = deps;
  const ipLimit = limits.signupIp(input.ip);
  if (await blocked(redis, ipLimit)) return { ok: false, error: "rate" };
  await hit(redis, ipLimit); // conta toda tentativa: o erro "exists" permite varrer e-mails

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const { password } = input;
  if (
    name.length < 1 || name.length > 100 ||
    email.length > 254 || !EMAIL_RE.test(email) ||
    password.length < PASSWORD_MIN || password.length > PASSWORD_MAX
  ) return { ok: false, error: "invalid" };

  // Inclui contas apagadas: o UNIQUE de email continua valendo para elas.
  const found = await db.query(`SELECT 1 FROM users WHERE email = $1`, [email]);
  if (found.rowCount) return { ok: false, error: "exists" };

  const hash = await hashPassword(password);
  try {
    const { rows } = await db.query(
      `INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id`,
      [email, name, hash],
    );
    return { ok: true, userId: rows[0].id };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: "exists" }; // cadastro simultâneo do mesmo e-mail
    throw err;
  }
}

export async function logIn(deps: Deps, input: { email: string; password: string; ip: string }): Promise<LogInResult> {
  const { db, redis } = deps;
  const email = normalizeEmail(input.email);
  const emailLimit = limits.loginEmail(email);
  const ipLimit = limits.loginIp(input.ip);
  if ((await blocked(redis, emailLimit)) || (await blocked(redis, ipLimit))) return { ok: false, error: "rate" };

  const { rows } = await db.query(
    `SELECT id, password_hash, ${ONBOARDED} AS onboarded FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );
  const user = rows[0];
  // Sem hash (e-mail inexistente ou conta Google) ou senha longa demais: verifyPassword(null) ainda gasta um scrypt.
  const hash = input.password.length > PASSWORD_MAX ? null : (user?.password_hash ?? null);
  if (!(await verifyPassword(input.password, hash))) {
    await hit(redis, emailLimit);
    await hit(redis, ipLimit);
    return { ok: false, error: "credentials" };
  }
  await clear(redis, emailLimit.key);
  return { ok: true, userId: user.id, onboarded: user.onboarded };
}

// null = o e-mail já pertence a outra conta (de senha, ou Google com outro sub): não vincula, não loga.
// O nome só vem do Google na primeira vez: depois é do usuário (ele edita no onboarding/perfil).
export async function upsertGoogleUser(
  db: Deps["db"],
  g: { sub: string; email: string; name?: string; picture?: string },
): Promise<{ userId: string; onboarded: boolean } | null> {
  const email = normalizeEmail(g.email);
  const existing = await db.query(`SELECT google_sub FROM users WHERE email = $1`, [email]);
  if (existing.rows[0] && existing.rows[0].google_sub !== g.sub) return null;
  try {
    const { rows } = await db.query(
      `INSERT INTO users (google_sub, email, name, avatar_url) VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub) DO UPDATE
         SET email = EXCLUDED.email, name = COALESCE(users.name, EXCLUDED.name), avatar_url = EXCLUDED.avatar_url
       RETURNING id, ${ONBOARDED} AS onboarded`,
      [g.sub, email, g.name ?? null, g.picture ?? null],
    );
    return { userId: rows[0].id, onboarded: rows[0].onboarded };
  } catch (err) {
    if (isUniqueViolation(err)) return null; // corrida, ou e-mail trocado no Google para um já usado
    throw err;
  }
}
