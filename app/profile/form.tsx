"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dict } from "../i18n";
import type { SaveResult } from "../profile";
import { QUESTIONS } from "../profile-fields";
import { STEPS, parseProfile, type Profile, type ProfileError, type Step } from "../profile-options";

export function ProfileForm({ initial, t, tp, locale, countries, save, children }: {
  initial: Profile;
  t: Dict["ob"];
  tp: Dict["profile"];
  locale: string;
  countries: [string, string][];
  save: (input: unknown) => Promise<SaveResult>;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [p, setP] = useState(initial);
  const [base, setBase] = useState(initial); // último estado salvo
  const [status, setStatus] = useState<"idle" | "saved" | "failed">("idle");
  const [serverError, setServerError] = useState<{ step: Step; error: ProfileError } | null>(null);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(p) !== JSON.stringify(base);
  const check = parseProfile(p);

  const set = (patch: Partial<Profile>) => {
    setP((cur) => ({ ...cur, ...patch }));
    setStatus("idle");
    setServerError(null);
  };

  // Sair com alterações não salvas: aviso nativo do navegador.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  // "Salvo." some sozinho.
  useEffect(() => {
    if (status !== "saved") return;
    const id = setTimeout(() => setStatus("idle"), 2000);
    return () => clearTimeout(id);
  }, [status]);

  const submit = () =>
    startTransition(async () => {
      try {
        const r = await save(p);
        if (!r.ok) {
          setServerError({ step: r.step, error: r.error });
          document.getElementById(`pf-${r.step}`)?.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
          return;
        }
        setBase(p);
        setStatus("saved");
        router.refresh(); // nome novo no nav
      } catch {
        setStatus("failed");
      }
    });

  // Mensagem por seção: erro do servidor, senão o primeiro problema local.
  const message = (s: Step) => {
    if (serverError?.step === s) return t.errors[serverError.error];
    if (!check.ok && check.step === s) return check.error === "required" ? t.need[s] : t.errors[check.error];
    return "";
  };

  return (
    <main className="pf">
      <header className="pf-head">
        <h1>{tp.h}</h1>
        <p className="lead">{tp.lead}</p>
      </header>
      <form className="pf-form" noValidate onSubmit={(e) => { e.preventDefault(); submit(); }}>
        {STEPS.map((s) => {
          const Q = QUESTIONS[s];
          const msg = message(s);
          return (
            <section key={s} id={`pf-${s}`} className="pf-sec">
              <h2>{t.short[s]}</h2>
              <Q p={p} set={set} t={t} locale={locale} countries={countries} />
              {msg && <p className="ob-hint bad">{msg}</p>}
            </section>
          );
        })}
        <div className="savebar" data-show={dirty || status !== "idle"} inert={!(dirty || status !== "idle")}>
          <div className="wrap">
            <span role="status">{status === "saved" ? tp.saved : status === "failed" || serverError ? tp.failed : tp.unsaved}</span>
            <button type="submit" className="btn sm" disabled={!dirty || !check.ok || pending}>{tp.save}</button>
          </div>
        </div>
      </form>
      {children}
    </main>
  );
}
