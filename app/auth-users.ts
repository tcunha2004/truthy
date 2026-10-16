import type { Pool } from "pg";
import { PASSWORD_MAX, PASSWORD_MIN, hashPassword, verifyPassword } from "./password.ts";
import { clear, limits, refund, take, type RateStore } from "./rate-limit.ts";

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
  // conta toda tentativa, válida ou não: o erro "exists" permite varrer e-mails
  if (!(await take(redis, ipLimit))) return { ok: false, error: "rate" };

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
  // Reserva as tentativas antes de autenticar (atômico); as que passam do máximo nem chegam ao banco.
  // Uma tentativa barrada por um limite não pode gastar o outro: senão um IP já bloqueado ainda travaria o login de qualquer e-mail.
  if (!(await take(redis, emailLimit))) return { ok: false, error: "rate" };
  if (!(await take(redis, ipLimit))) {
    await refund(redis, emailLimit.key);
    return { ok: false, error: "rate" };
  }

  const { rows } = await db.query(
    `SELECT id, password_hash, ${ONBOARDED} AS onboarded FROM users WHERE email = $1 AND deleted_at IS NULL`,
    [email],
  );
  const user = rows[0];
  // Sem hash (e-mail inexistente ou conta Google) ou senha longa demais: verifyPassword(null) ainda gasta um scrypt.
  const hash = input.password.length > PASSWORD_MAX ? null : (user?.password_hash ?? null);
  if (!(await verifyPassword(input.password, hash))) return { ok: false, error: "credentials" };
  // Sucesso: zera o e-mail e devolve a tentativa do IP (só falhas contam).
  await clear(redis, emailLimit.key);
  await refund(redis, ipLimit.key);
  return { ok: true, userId: user.id, onboarded: user.onboarded };
}

export type GoogleUserResult =
  | { ok: true; userId: string; onboarded: boolean }
  | { ok: false; error: "google_password" | "google" };

// Não vincula contas: se o e-mail já é de outra conta, não loga. "google_password" só quando a outra conta é de senha;
// qualquer outro conflito (outra conta Google com o mesmo e-mail, corrida) é o erro genérico "google".
// O nome só vem do Google na primeira vez: depois é do usuário (ele edita no onboarding/perfil).
export async function upsertGoogleUser(
  db: Deps["db"],
  g: { sub: string; email: string; name?: string; picture?: string },
): Promise<GoogleUserResult> {
  const email = normalizeEmail(g.email);
  const existing = await db.query(`SELECT google_sub FROM users WHERE email = $1`, [email]);
  const other = existing.rows[0];
  if (other && other.google_sub !== g.sub) return { ok: false, error: other.google_sub ? "google" : "google_password" };
  try {
    const { rows } = await db.query(
      `INSERT INTO users (google_sub, email, name, avatar_url) VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_sub) DO UPDATE
         SET email = EXCLUDED.email, name = COALESCE(users.name, EXCLUDED.name), avatar_url = EXCLUDED.avatar_url
       RETURNING id, ${ONBOARDED} AS onboarded`,
      [g.sub, email, g.name ?? null, g.picture ?? null],
    );
    return { ok: true, userId: rows[0].id, onboarded: rows[0].onboarded };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, error: "google" }; // corrida, ou e-mail trocado no Google para um já usado
    throw err;
  }
}
