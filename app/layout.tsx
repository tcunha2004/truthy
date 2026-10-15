import type { Metadata } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { LangToggle, ThemeToggle } from "./client";
import { dicts, getLang, locales } from "./i18n";
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
              <Link href="/saved">{t.nav.saved}</Link>
            </nav>
            <LangToggle lang={lang} label={t.nav.language} />
            <ThemeToggle toDark={t.nav.toDark} toLight={t.nav.toLight} />
            <Link className="btn sm" href="/login">{t.nav.signin}</Link>
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
