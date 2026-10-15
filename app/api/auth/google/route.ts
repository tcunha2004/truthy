import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

export function GET(req: NextRequest) {
  const state = randomBytes(32).toString("base64url");

  const google = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  google.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    // ponytail: origem vem da própria requisição; atrás de proxy/CDN, trocar por uma env APP_URL
    redirect_uri: new URL("/api/auth/google/callback", req.url).toString(),
    response_type: "code",
    scope: "openid email profile",
    state,
  }).toString();

  const res = NextResponse.redirect(google);
  res.cookies.set("oauth_state", state, {
    httpOnly: true, // JavaScript da página não lê
    sameSite: "lax", // sobrevive ao redirect de volta do Google
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 10,
    path: "/",
  });
  return res;
}
