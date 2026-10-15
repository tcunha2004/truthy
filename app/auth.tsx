import Link from "next/link";
import { redirect } from "next/navigation";
import { dicts, getLang } from "./i18n";
import { getUser } from "./session";

type Mode = "login" | "signup";

export async function authMetadata(mode: Mode) {
  const t = dicts[await getLang()];
  return { title: `${t.auth[mode]} · truthy` };
}

// ponytail: design only, submit does nothing until auth is wired (email/password + Google)
async function submit() {
  "use server";
}

export async function AuthPage({ mode, error }: { mode: Mode; error?: boolean }) {
  if (await getUser()) redirect("/");
  const t = dicts[await getLang()].auth;
  const signup = mode === "signup";

  return (
    <main className="auth">
      <h1>{signup ? t.signupH : t.loginH}</h1>
      <p className="lead">
        {signup ? t.signupLead : <>{t.loginLead} <code className="true">true</code>.</>}
      </p>

      <div className="auth-card">
        <nav className="seg" aria-label={t.modes}>
          <Link href="/login" aria-current={signup ? undefined : "page"}>{t.login}</Link>
          <Link href="/signup" aria-current={signup ? "page" : undefined}>{t.signup}</Link>
        </nav>

        {error && <p className="auth-error" role="alert">{t.googleError}</p>}

        <form action={submit} className="auth-form">
          {signup && (
            <label className="field">{t.name}<input name="name" autoComplete="name" required /></label>
          )}
          <label className="field">{t.email}<input type="email" name="email" autoComplete="email" placeholder={t.emailPh} required /></label>
          <label className="field">
            {t.password}
            <input
              type="password"
              name="password"
              autoComplete={signup ? "new-password" : "current-password"}
              minLength={signup ? 8 : undefined}
              aria-describedby={signup ? "pw-hint" : undefined}
              required
            />
            {signup && <small id="pw-hint">{t.passwordHint}</small>}
          </label>
          <button className="btn" type="submit">{signup ? t.signup : t.login}</button>
        </form>

        <p className="or"><span>{t.or}</span></p>

        {/* <a> e não <Link>: o Link faria prefetch da rota e geraria um state à toa */}
        <a className="btn line" href="/api/auth/google">
          <svg className="g" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {t.google}
        </a>
      </div>
    </main>
  );
}
