import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/app/db";
import { SESSION_COOKIE, SESSION_DAYS, createSession } from "@/app/session";

type IdToken = { sub: string; email: string; email_verified: boolean; name?: string; picture?: string };

// Passo 2 do fluxo OAuth: o Google devolve a pessoa aqui com ?code=...&state=...
export async function GET(req: NextRequest) {
  const done = (path = "/login?error=google") => {
    const res = NextResponse.redirect(new URL(path, req.url));
    res.cookies.delete("oauth_state"); // o state só vale para uma tentativa
    return res;
  };

  // 1. O state que voltou é o mesmo que guardamos? Se não, alguém forjou esta volta.
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  if (!code || !state || state !== req.cookies.get("oauth_state")?.value) return done();

  // 2. Troca o code por tokens, direto com o Google (servidor ↔ servidor, via HTTPS).
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: new URL("/api/auth/google/callback", req.url).toString(),
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return done();
  const { id_token } = await tokenRes.json();

  // 3. Lê o JWT (header.payload.assinatura). Sem checar assinatura: veio direto do Google via HTTPS.
  const google: IdToken = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString());
  if (!google.email_verified) return done();

  // 4. Upsert: se a pessoa já existe (mesmo sub), atualiza; senão, cria.
  // ponytail: chave só no google_sub; quando entrar email/senha, ligar contas pelo email aqui
  const { rows } = await db.query(
    `INSERT INTO users (google_sub, email, name, avatar_url) VALUES ($1, $2, $3, $4)
     ON CONFLICT (google_sub) DO UPDATE
       SET email = EXCLUDED.email, name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
     RETURNING id`,
    [google.sub, google.email, google.name ?? null, google.picture ?? null],
  );

  // 5. Cria a sessão e entrega o cookie. A partir daqui, o login é nosso, não do Google.
  const res = done("/");
  res.cookies.set(SESSION_COOKIE, await createSession(rows[0].id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    path: "/",
  });
  return res;
}
