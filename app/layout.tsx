import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LangToggle, ThemeToggle } from "./client";
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
    <html lang={locales[lang]} data-theme="light" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <header className="nav">
          <div className="wrap">
            <Link className="mark" href="/">truthy<i aria-hidden="true" /></Link>
            <nav className="links" aria-label={t.nav.main}>
              <Link href="/jobs">{t.nav.jobs}</Link>
              <Link href="/companies">{t.nav.companies}</Link>
              {user && <Link href="/saved">{t.nav.saved}</Link>}
            </nav>
            <LangToggle lang={lang} label={t.nav.language} />
            <ThemeToggle toDark={t.nav.toDark} toLight={t.nav.toLight} />
            {user ? (
              <form action={logout} className="who">
                {user.avatar_url ? (
                  // <img> e não next/image: evita configurar o domínio do Google; no-referrer porque o Google às vezes bloqueia avatar com referer
                  <img className="avatar" src={user.avatar_url} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <i className="avatar" aria-hidden="true">{(user.name ?? user.email)[0].toUpperCase()}</i>
                )}
                <span>{user.name?.split(" ")[0] ?? user.email}</span>
                <button className="btn sm quiet">{t.nav.signout}</button>
              </form>
            ) : (
              <Link className="btn sm" href="/login">{t.nav.signin}</Link>
            )}
          </div>
        </header>
        {children}
        <footer>
          <div className="wrap">
            <span>{t.foot}</span>
            <span>truthy · {new Date().getFullYear()}</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
