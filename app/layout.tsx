import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LangToggle, NavLinks, ThemeToggle } from "./client";
import { dicts, getLang, locales } from "./i18n";
import { getUser, logout } from "./session";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], axes: ["opsz"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: "500", variable: "--font-jetbrains" });

export async function generateMetadata(): Promise<Metadata> {
  return dicts[await getLang()].meta;
}

// Runs before paint so a saved dark theme never flashes light.
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const t = dicts[lang];
  const user = await getUser();
  return (
    <html lang={locales[lang]} data-theme="light" data-scroll-behavior="smooth" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="nav">
          <div className="wrap">
            <Link className="mark" href="/">truthy<i aria-hidden="true" /></Link>
            {/* deslogado não vê as seções: só marca, idioma, tema e Entrar */}
            {user ? (
              <NavLinks
                label={t.nav.main}
                items={[
                  { href: "/jobs", match: "/jobs", text: t.nav.jobs },
                  { href: "/companies", match: "/companies", text: t.nav.companies },
                  { href: "/saved", match: "/saved", text: t.nav.saved },
                ]}
              />
            ) : (
              <span className="nav-gap" />
            )}
            <LangToggle lang={lang} label={t.nav.language} />
            <ThemeToggle toDark={t.nav.toDark} toLight={t.nav.toLight} />
            {user ? (
              <>
                {!user.onboarded && <Link className="btn sm" href="/onboarding">{t.nav.finish}</Link>}
                <form action={logout} className="who">
                  <Link className="me" href="/profile" aria-label={`${user.name?.split(" ")[0] ?? user.email}, ${t.nav.profile}`}>
                    {user.avatar_url ? (
                      // <img> e não next/image: evita configurar o domínio do Google; no-referrer porque o Google às vezes bloqueia avatar com referer
                      <img className="avatar" src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <i className="avatar" aria-hidden="true">{(user.name ?? user.email)[0].toUpperCase()}</i>
                    )}
                    <span>{user.name?.split(" ")[0] ?? user.email}</span>
                  </Link>
                  <button className="btn sm quiet">{t.nav.signout}</button>
                </form>
              </>
            ) : (
              <Link className="btn sm" href="/login">{t.nav.signin}</Link>
            )}
          </div>
        </header>
        {children}
        <footer>
          <div className="wrap">
            <span>{t.foot}</span>
            <span><Link href="/privacy">{t.privacy.title}</Link> · truthy · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
