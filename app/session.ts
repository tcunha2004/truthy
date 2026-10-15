import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 30;

// O banco guarda só o hash: se vazar, ninguém consegue montar um cookie válido.
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Cria a sessão no banco e devolve o token que vai no cookie.
export async function createSession(userId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hash(token), userId, SESSION_DAYS],
  );
  return token;
}
