"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { flushSync } from "react-dom";
import { Icon } from "../icons";
import type { Dict } from "../i18n";
import type { SaveResult } from "../profile";
import { QUESTIONS, summary } from "../profile-fields";
import { STEPS, parseStep, type Profile, type ProfileError, type Step } from "../profile-options";

type Screen = Step | "done";
const ORDER: readonly Screen[] = [...STEPS, "done"];
const AUTO = new Set<Screen>(["field", "seniority", "status"]); // escolha única: avança sozinho no clique
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Wizard({ initial, start, t, locale, countries, saveStep, finish }: {
  initial: Profile;
  start: Screen;
  t: Dict["ob"];
  locale: string;
  countries: [string, string][];
  saveStep: (step: Step, input: unknown) => Promise<SaveResult>;
  finish: (input: unknown) => Promise<SaveResult>;
}) {
  const [p, setP] = useState(initial);
  const [screen, setScreen] = useState<Screen>(start);
  const [error, setError] = useState<ProfileError | null>(null);
  const [fromSummary, setFromSummary] = useState(false); // editando pelo resumo: Continuar volta para o resumo
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const box = useRef<HTMLFormElement>(null);
  const current = useRef(screen);
  current.current = screen;

  const i = ORDER.indexOf(screen);
  const total = STEPS.length;
  const check = screen === "done" ? null : parseStep(screen, p);
  const valid = !check || check.ok;

  const set = (patch: Partial<Profile>) => {
    setP((cur) => ({ ...cur, ...patch }));
    setError(null);
  };

  // Troca de tela: desliza para a esquerda ao avançar e para a direita ao voltar.
  const show = (to: Screen, push = true) => {
    clearTimeout(timer.current); // um avanço automático pendente não pode atropelar a troca de tela
    setError(null);
    if (push) history.pushState(null, "", `?step=${to}`);
    document.documentElement.dataset.dir = ORDER.indexOf(to) >= ORDER.indexOf(current.current) ? "fwd" : "back";
    const swap = () => flushSync(() => setScreen(to));
    if (document.startViewTransition && !reduced()) document.startViewTransition(swap);
    else swap();
  };

  const next = () => {
    if (screen === "done" || !valid) return;
    void saveStep(screen, p).catch(() => {}); // só para retomar depois; o finish() reenvia tudo
    if (fromSummary) setFromSummary(false);
    show(fromSummary ? "done" : ORDER[i + 1]);
  };
  const prev = () => i > 0 && show(ORDER[i - 1]);

  // O timer chama a versão mais nova de next(), que já enxerga a escolha recém-feita.
  const nextRef = useRef(next);
  nextRef.current = next;
  const timer = useRef<number | undefined>(undefined);
  const pick = () => {
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => nextRef.current(), reduced() ? 0 : 300);
  };

  const edit = (s: Step) => {
    setFromSummary(true);
    show(s);
  };

  const submit = () =>
    startTransition(async () => {
      setFailed(false);
      try {
        const r = await finish(p);
        if (!r.ok) {
          setFromSummary(true);
          show(r.step);
          setError(r.error); // depois do show(): trocar de tela limpa o erro
          return;
        }
        // ponytail: "Ver vagas" vai para / até /jobs existir; troque para /jobs quando a listagem existir
        location.assign("/"); // navegação completa: o nav recarrega sem o "Concluir perfil"
      } catch {
        setFailed(true);
      }
    });

  // URL reflete o passo; o Voltar do navegador volta um passo.
  useEffect(() => {
    history.replaceState(null, "", `?step=${start}`);
    const onPop = () => {
      const s = new URLSearchParams(location.search).get("step") as Screen;
      if (ORDER.includes(s)) show(s, false);
    };
    addEventListener("popstate", onPop);
    return () => {
      removeEventListener("popstate", onPop);
      clearTimeout(timer.current);
    };
  }, []);

  // Foco no controle certo de cada tela: [data-autofocus], senão a opção marcada, senão o primeiro campo.
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const el =
      root.querySelector<HTMLInputElement>("[data-autofocus]:not(:disabled)") ??
      root.querySelector<HTMLInputElement>("input:checked") ??
      root.querySelector<HTMLInputElement>("input:not(:disabled), select");
    el?.focus({ preventScroll: true });
    if (el?.type === "text") el.setSelectionRange(el.value.length, el.value.length);
  }, [screen]);

  // Enter num chip (radio/checkbox) também avança; nos campos de texto, o submit do form já cuida disso.
  const onKey = (e: KeyboardEvent<HTMLFormElement>) => {
    const el = e.target as HTMLInputElement;
    if (e.key === "Enter" && (el.type === "radio" || el.type === "checkbox")) {
      e.preventDefault();
      next();
    }
  };

  const stepOf = t.stepOf.replace("{n}", String(Math.min(i + 1, total))).replace("{total}", String(total));
  const hint = error ? t.errors[error] : check && !check.ok ? (check.error === "required" ? t.need[check.step] : t.errors[check.error]) : "";
  const Q = screen === "done" ? null : QUESTIONS[screen];

  return (
    <main className="ob">
      <div className="ob-bar" aria-hidden="true">
        <i style={{ width: `${(i / total) * 100}%` }} />
      </div>
      <p className="sr" aria-live="polite">{screen === "done" ? t.done.h : stepOf}</p>

      <form ref={box} className="ob-step" noValidate onKeyDown={onKey} onSubmit={(e) => { e.preventDefault(); next(); }}>
        {screen === "done" || !Q ? (
          <div className="ob-done">
            <h1>{t.done.h} <code className="true">true</code>.</h1>
            <p className="lead">{t.done.lead}</p>
            <ul className="ob-sum">
              {STEPS.map((s) => (
                <li key={s}>
                  <button type="button" className="ob-row" onClick={() => edit(s)}>
                    <span>{t.short[s]}</span>
                    <b>{summary(s, p, t, locale, countries)}</b>
                    <Icon name="chev" />
                  </button>
                </li>
              ))}
            </ul>
            {failed && <p className="ob-hint bad" role="alert">{t.done.saveError}</p>}
            <button type="button" className="btn" data-autofocus disabled={pending} onClick={submit}>
              {failed ? t.done.retry : t.done.cta}
            </button>
          </div>
        ) : (
          <>
            <p className="ob-n" aria-hidden="true">{stepOf}</p>
            <h1>{t[screen].h}</h1>
            <p className="lead">{t[screen].lead}</p>
            <div className="ob-body">
              <Q p={p} set={set} t={t} locale={locale} countries={countries} pick={AUTO.has(screen) ? pick : undefined} />
            </div>
            <div className="ob-foot">
              {i > 0 ? <button type="button" className="btn quiet" onClick={prev}>{t.back}</button> : <span />}
              <div className="ob-go">
                <p className={error ? "ob-hint bad" : "ob-hint"} role={error ? "alert" : undefined}>{hint}</p>
                <button type="submit" className="btn" disabled={!valid}>{t.next}</button>
              </div>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
