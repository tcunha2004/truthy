import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";

export type User = { id: string; name: string | null; email: string; avatar_url: string | null; onboarded: boolean };

export const SESSION_COOKIE = "session";
export const SESSION_DAYS = 30;

// O banco guarda só o hash: se vazar, ninguém consegue montar um cookie válido.
const hash = (token: string) => createHash("sha256").update(token).digest("hex");

// Cria a sessão no banco e devolve o token que vai no cookie.
export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await db.query(
    `INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))`,
    [hash(token), userId, SESSION_DAYS],
  );
  return token;
}

// Cria a sessão e entrega o cookie. Serve para quem tem um `jar` com set(): cookies() nas actions, res.cookies nas rotas.
export async function startSession(
  userId: string,
  jar: {
    set(
      name: string,
      value: string,
      options: { httpOnly: boolean; sameSite: "lax"; secure: boolean; maxAge: number; path: string },
    ): unknown;
  },
) {
  jar.set(SESSION_COOKIE, await createSession(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: "/",
  });
}

// Checagem segura: o cookie só vale se o hash dele estiver no banco e a sessão não tiver expirado.
// cache(): layout e página na mesma requisição fazem uma consulta só.
export const getUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.avatar_url, p.onboarded_at IS NOT NULL AS onboarded
     FROM sessions s JOIN users u ON u.id = s.user_id LEFT JOIN profiles p ON p.user_id = u.id
     WHERE s.id = $1 AND s.expires_at > now() AND u.deleted_at IS NULL`,
    [hash(token)],
  );
  return rows[0] ?? null;
});

// Páginas autenticadas: sem login vai para /login; sem onboarding concluído vai para /onboarding.
export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!user.onboarded) redirect("/onboarding");
  return user;
}

// ponytail: sessões expiradas ficam no banco; um DELETE ... WHERE expires_at < now() periódico resolve
export async function logout() {
  "use server";
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.query(`DELETE FROM sessions WHERE id = $1`, [hash(token)]);
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
