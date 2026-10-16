"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./icons";
import type { Dict, Lang } from "./i18n";
import { fold } from "./profile-options";
import { setSaved } from "./saved-action";

export function LangToggle({ lang, label }: { lang: Lang; label: string }) {
  const router = useRouter();
  const pick = (l: Lang) => {
    document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className="lang" role="group" aria-label={label}>
      <button type="button" aria-pressed={lang === "en"} lang="en" onClick={() => pick("en")}>EN</button>
      <button type="button" aria-pressed={lang === "pt"} lang="pt-BR" onClick={() => pick("pt")}>PT</button>
    </div>
  );
}

// Links principais com aria-current na seção aberta. "match" é separado do href: deslogado, Vagas aponta
// para /login, e a tela de login não deve aparecer como "Vagas".
export function NavLinks({ label, items }: { label: string; items: { href: string; match: string; text: string }[] }) {
  const path = usePathname();
  return (
    <nav className="links" aria-label={label}>
      {items.map((i) => (
        <Link key={i.match} href={i.href} aria-current={path.startsWith(i.match) ? "page" : undefined}>{i.text}</Link>
      ))}
    </nav>
  );
}

export function ThemeToggle({ toDark, toLight }: { toDark: string; toLight: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  const toggle = () => {
    const t = dark ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem("theme", t); } catch {}
    setDark(!dark);
  };
  return (
    <button type="button" className="theme" aria-label={dark ? toLight : toDark} onClick={toggle}>
      <Icon name="sun" className="sun" />
      <Icon name="moon" className="moon" />
    </button>
  );
}

// Chips rápidos da landing → o parâmetro da /jobs que cada um liga.
const chips = { remote: ["remote", "1"], br: ["country", "BR"] } as const;
type Chip = keyof typeof chips;
const chipKeys = Object.keys(chips) as Chip[];

export function SearchForm({ t }: { t: Dict["hero"] }) {
  const [on, setOn] = useState<Record<Chip, boolean>>({ remote: true, br: false });
  return (
    <>
      <form className="search one" role="search" action="/jobs">
        <label><Icon name="search" /><input type="search" name="q" aria-label={t.q} placeholder={t.q} /></label>
        {chipKeys.map((c) => on[c] && <input key={c} type="hidden" name={chips[c][0]} value={chips[c][1]} />)}
        <button className="btn" type="submit">{t.cta}</button>
      </form>
      <div className="filters" role="group" aria-label={t.filters}>
        {chipKeys.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={on[c]} onClick={() => setOn({ ...on, [c]: !on[c] })}>
            {t[c]}
          </button>
        ))}
      </div>
    </>
  );
}

export function SaveButton({ saved = false, disabled = false, t }: { saved?: boolean; disabled?: boolean; t: Dict["job"] }) {
  const [on, setOn] = useState(saved);
  return (
    <button type="button" className="save" aria-pressed={on} aria-label={t.save} disabled={disabled} onClick={() => setOn(!on)}>
      <Icon name="save" />
    </button>
  );
}

// Marcador de verdade: grava no banco pela server action. Funciona sem JavaScript (o form posta para ela).
// Enquanto o servidor responde, já mostra o estado novo; se falhar, o estado devolvido é o anterior.
// Desativado só em vaga fechada que não está salva: a salva precisa poder sair dos salvos.
export function SaveJob({ jobId, saved, closed = false, t }: { jobId: string; saved: boolean; closed?: boolean; t: Dict["job"] }) {
  const [state, action, pending] = useActionState(setSaved, saved);
  const shown = pending ? !state : state;
  return (
    <form action={action} className="save-form">
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="saved" value={shown ? "0" : "1"} />
      <button className="save" aria-pressed={shown} aria-label={t.save} disabled={closed && !shown}>
        <Icon name="save" />
      </button>
    </form>
  );
}

export type CompanyCard = {
  slug: string;
  href: string;
  name: string;
  logo: string | null;
  meta: string;
  open: string;
  openLabel: string;
  read: string;
};

export function CompanyBrowser({ companies, initialQuery, t }: { companies: CompanyCard[]; initialQuery: string; t: Dict["companies"] }) {
  const [q, setQ] = useState(initialQuery);
  const shown = companies.filter((c) => fold(c.name).includes(fold(q.trim())));

  return (
    <>
      <div className="co-controls">
        <label className="co-search">
          <Icon name="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.search} aria-label={t.search} />
        </label>
      </div>

      <div className="co-stage">
        {shown.length ? (
          <ul className="co-grid">
            {shown.map((c) => (
              <li key={c.slug}>
                <Link className="co-tile" href={c.href}>
                  <div className="co-art" aria-hidden="true">
                    {c.logo ? (
                      <>
                        <img className="co-blur" src={c.logo} alt="" />
                        <img className="co-icon" src={c.logo} alt="" width={96} height={96} />
                      </>
                    ) : (
                      <span className="co-icon co-initial">{c.name[0]}</span>
                    )}
                  </div>
                  <div className="co-body">
                    <h2>{c.name}</h2>
                    <p className="co-meta">{c.meta}</p>
                    <p className="co-open"><b className="num">{c.open}</b> {c.openLabel}</p>
                    <p className="co-read"><span className="dot" aria-hidden="true" />{c.read}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <b>{t.emptyH}</b>
            <p>{t.emptyP}</p>
            <button type="button" className="btn quiet sm" onClick={() => setQ("")}>{t.clear}</button>
          </div>
        )}
      </div>
    </>
  );
}

// The one authored moment: each listing is verified in turn on load.
export function OpenStatus({ ats, order, t }: { ats: string; order: number; t: Dict["job"] }) {
  const [checking, setChecking] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setChecking(false), 500 + order * 260);
    return () => clearTimeout(id);
  }, [order]);
  return (
    <span className={`status${checking ? " checking" : ""}`}>
      <Icon name="check" className="ck" />
      <b>{checking ? t.checking : `${t.openVia} ${ats}`}</b>
    </span>
  );
}
