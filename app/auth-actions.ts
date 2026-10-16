"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { logIn, signUp } from "./auth-users";
import type { AuthError } from "./auth-error";
import { db } from "./db";
import { clientIp } from "./rate-limit";
import { getRedis } from "./redis";
import { startSession } from "./session";

// Um valor que não é texto (arquivo, ausente) conta como vazio.
const text = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
};

// Não loga o objeto do erro: um DatabaseError do pg traz a linha inteira (inclusive password_hash) em `detail`.
const describe = (err: unknown) =>
  err instanceof Error ? `${err.name}${(err as { code?: string }).code ? ` ${(err as { code?: string }).code}` : ""}: ${err.message}` : String(err);

// Os redirect() ficam fora do try: eles funcionam lançando uma exceção.
// Qualquer falha de infraestrutura (Redis fora do ar, banco) vira "invalid": falha fechado, ninguém é autenticado.
export async function loginAction(form: FormData): Promise<void> {
  let failure: AuthError | undefined;
  let to = "/";
  try {
    const result = await logIn(
      { db, redis: await getRedis() },
      { email: text(form, "email"), password: text(form, "password"), ip: clientIp(await headers()) },
    );
    if (result.ok) {
      await startSession(result.userId, await cookies());
      to = result.onboarded ? "/" : "/onboarding";
    } else {
      failure = result.error;
    }
  } catch (err) {
    console.error("loginAction:", describe(err));
    failure = "invalid";
  }
  redirect(failure ? `/login?error=${failure}` : to);
}

export async function signupAction(form: FormData): Promise<void> {
  let failure: AuthError | undefined;
  try {
    const result = await signUp(
      { db, redis: await getRedis() },
      {
        name: text(form, "name"),
        email: text(form, "email"),
        password: text(form, "password"),
        ip: clientIp(await headers()),
      },
    );
    if (result.ok) await startSession(result.userId, await cookies());
    else failure = result.error;
  } catch (err) {
    console.error("signupAction:", describe(err));
    failure = "invalid";
  }
  redirect(failure ? `/signup?error=${failure}` : "/onboarding");
}
