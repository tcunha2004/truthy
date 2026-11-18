"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, useTransition, type CSSProperties } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./icons";
import type { Dict, Lang } from "./i18n";
import type { MatchState } from "./match";
import { fold } from "./profile-options";
import { markApplied } from "./applied-action";

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

// Pergunta "você se candidatou?" quando a pessoa volta de um link de vaga (atributos de applyAttrs, job-row.tsx).
// Escuta cliques no documento inteiro, então as linhas continuam componentes de servidor. Aparece quando a aba volta
// a ficar visível (o link abre o ATS em outra aba); com cmd/ctrl-clique, aparece quando ela visitar a aba e voltar.
// Sim grava e atualiza a página (a linha passa a mostrar "Aplicada"); Ainda não só fecha.
export function ApplyPrompt({ t }: { t: Dict["apply"] }) {
  const router = useRouter();
  const [job, setJob] = useState<{ id: string; label: string } | null>(null);
  const [show, setShow] = useState(false);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    const pick = (e: MouseEvent) => {
      const a = (e.target as Element).closest?.("a[data-apply]");
      if (!(a instanceof HTMLElement)) return;
      setJob({ id: a.dataset.apply!, label: a.dataset.label! });
      setShow(false);
      setFailed(false);
    };
    const back = () => document.visibilityState === "visible" && setShow(true);
    addEventListener("click", pick);
    addEventListener("auxclick", pick); // clique do meio também abre a vaga
    document.addEventListener("visibilitychange", back);
    return () => {
      removeEventListener("click", pick);
      removeEventListener("auxclick", pick);
      document.removeEventListener("visibilitychange", back);
    };
  }, []);

  const close = () => setShow(false);
  const yes = () => start(async () => {
    if (!job) return;
    if (!(await markApplied(job.id))) return setFailed(true);
    close();
    router.refresh();
  });

  return (
    <div className="savebar apply-bar" data-show={show && !!job} role="region" aria-label={t.label} inert={!show}>
      <div className="wrap">
        <p aria-live="polite">
          {show && job && <><b>{job.label}</b><span>{failed ? t.failed : t.ask}</span></>}
        </p>
        <div className="apply-go">
          <button type="button" className="btn sm quiet" onClick={close}>{t.no}</button>
          <button type="button" className="btn sm" onClick={yes} disabled={pending}>{t.yes}</button>
        </div>
      </div>
    </div>
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

const CARD_W = 300;
const RING_C = 2 * Math.PI * 19;

// Ícone da análise por IA e o card de vidro. Abre no hover (mouse), no foco (teclado) e no toque; o card é fixed
// para escapar do overflow: hidden da lista, e vira para cima perto do fim da tela.
// Recebe a promise do servidor e fica montado o tempo todo: um fallback de Suspense ainda em streaming não é
// hidratado (ícone sem handlers), e trocar de componente quando a análise chega fecharia o card aberto.
export function MatchTip({ data, t }: { data: Promise<MatchState>; t: Dict["match"] }) {
  const [state, setState] = useState<MatchState | null>(null); // null = analisando
  useEffect(() => {
    let live = true;
    data.then((s) => live && setState(s));
    return () => { live = false; };
  }, [data]);
  const [pos, setPos] = useState<CSSProperties | null>(null);
  const [drawn, setDrawn] = useState(false);
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const pointer = useRef(""); // tipo do ponteiro do clique em curso; "" = teclado
  const leave = useRef<ReturnType<typeof setTimeout>>(undefined);
  const open = pos !== null;

  const show = () => {
    const r = btn.current!.getBoundingClientRect();
    setPos({ left: Math.min(Math.max(16, r.right - CARD_W), innerWidth - CARD_W - 16), top: r.bottom + 8 });
  };
  const hide = () => { clearTimeout(leave.current); setPos(null); };
  // o card fica 8px longe do ícone: a espera deixa o mouse atravessar o vão e parar em cima dele (WCAG 1.4.13)
  const hideSoon = () => { leave.current = setTimeout(hide, 150); };

  // Abre embaixo; se a altura real do card (que muda quando a análise chega) não couber, vira para cima do ícone.
  useLayoutEffect(() => {
    if (!pos || pos.top === undefined) return;
    const r = btn.current!.getBoundingClientRect();
    if (r.bottom + 8 + card.current!.offsetHeight > innerHeight - 8 && r.top > innerHeight - r.bottom) {
      setPos({ left: pos.left, bottom: innerHeight - r.top + 8 });
    }
  }, [pos, state]);

  // O anel começa vazio e anima até a nota ao abrir, e de novo se a análise chega com o card aberto.
  useLayoutEffect(() => {
    setDrawn(false);
    if (!open) return;
    // dois frames: o anel precisa ser pintado vazio antes, senão a transição não roda
    let f = requestAnimationFrame(() => (f = requestAnimationFrame(() => setDrawn(true))));
    return () => cancelAnimationFrame(f);
  }, [open, state]);

  useEffect(() => {
    if (!open) return;
    // toque fora fecha (no iOS o botão não ganha foco, então o blur não basta)
    const outside = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) hide(); };
    // Escape fecha mesmo quando o card abriu por hover, com o foco em outro lugar
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (box.current?.contains(document.activeElement)) btn.current?.focus();
      hide();
    };
    addEventListener("scroll", hide, true);
    addEventListener("resize", hide);
    addEventListener("pointerdown", outside);
    addEventListener("keydown", esc);
    return () => {
      removeEventListener("scroll", hide, true);
      removeEventListener("resize", hide);
      removeEventListener("pointerdown", outside);
      removeEventListener("keydown", esc);
    };
  }, [open]);

  const dim = state?.kind === "limited" || state?.kind === "unavailable";
  return (
    <span
      ref={box}
      className="ai"
      onPointerEnter={(e) => { if (e.pointerType !== "mouse") return; clearTimeout(leave.current); if (!open) show(); }}
      onPointerLeave={(e) => e.pointerType === "mouse" && hideSoon()}
      onFocus={() => !pointer.current && !open && show()}
      onBlur={(e) => { pointer.current = ""; if (!box.current?.contains(e.relatedTarget as Node)) hide(); }}
      // dentro do <summary> de um grupo, nenhum clique aqui (botão ou card) pode abrir/fechar o <details>
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <button
        ref={btn}
        type="button"
        className={"ai-btn" + (state === null ? " busy" : "") + (dim ? " dim" : "")}
        aria-label={t.label}
        aria-expanded={open}
        aria-controls={id}
        onPointerDown={(e) => { pointer.current = e.pointerType; }}
        onPointerCancel={() => { pointer.current = ""; }}
        // mouse: o hover já abriu, o clique só mantém. Toque e teclado: alterna.
        onClick={() => { if (pointer.current === "mouse" || !open) show(); else hide(); pointer.current = ""; }}
      >
        <Icon name="claude" />
      </button>
      {open && (
        <div ref={card} id={id} role="dialog" aria-label={t.label} className="ai-card" style={pos}>
          {state === null ? <p>{t.pending}</p>
            : state.kind === "unavailable" ? <p>{t.unavailable}</p>
            : state.kind === "limited" ? <p>{t.limited.replace("{n}", String(state.minutes))}</p>
            : (
              <>
                <div className="ai-head">
                  <span className="ai-ring-box">
                    <svg viewBox="0 0 44 44" className="ai-ring" aria-hidden="true">
                      <circle className="track" cx="22" cy="22" r="19" />
                      <circle className="bar" cx="22" cy="22" r="19"
                        style={{ strokeDasharray: RING_C, strokeDashoffset: drawn ? RING_C * (1 - state.match.score / 10) : RING_C }} />
                    </svg>
                    <b className="num">{state.match.score.toFixed(1)}</b>
                  </span>
                  {t.score}
                </div>
                <h4>{t.have}</h4>
                <p>{state.match.matching.join(" · ") || t.noneHave}</p>
                <h4>{t.missing}</h4>
                <p>{state.match.missing.join(" · ") || t.noneMissing}</p>
              </>
            )}
          <p className="ai-foot">{t.footer}</p>
        </div>
      )}
    </span>
  );
}
