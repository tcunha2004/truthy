import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/app/db";
import { upsertGoogleUser } from "@/app/auth-users";
import { startSession } from "@/app/session";

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

  // 4. Cria ou entra na conta Google. Contas Google e de senha não são vinculadas (decisão da spec;
  // vínculo só depois que houver verificação de e-mail): se o e-mail já é de uma conta de senha, não loga.
  const user = await upsertGoogleUser(db, google);
  if (!user.ok) return done(`/login?error=${user.error}`);

  // 5. Cria a sessão e entrega o cookie. A partir daqui, o login é nosso, não do Google.
  // Quem ainda não concluiu o perfil vai para o onboarding.
  const res = done(user.onboarded ? "/" : "/onboarding");
  await startSession(user.userId, res.cookies);
  return res;
}
