"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ClipboardEvent, type ReactNode } from "react";
import { Icon } from "./icons";
import type { Dict } from "./i18n";
import {
  CONTRACTS, CURRENCIES, FIELDS, FIELD_LABELS, MAX_STACK, SALARY, SENIORITIES, STACK_CATALOG,
  STACK_SUGGESTIONS, STATUSES, WORK_MODELS, addStack, fold, type Profile, type Step,
} from "./profile-options";

export type QProps = {
  p: Profile;
  set: (patch: Partial<Profile>) => void;
  t: Dict["ob"];
  locale: string;
  countries: [string, string][];
  pick?: () => void; // wizard: chamado depois de uma escolha única feita com mouse/toque (avanço automático)
};

// Chips que são <input> nativos: radio (escolha única) ou checkbox (múltipla). Setas e espaço funcionam de graça.
function Picks<T extends string>({ name, label, hideLabel = false, options, text, value, onChange, multi = false, pick, card = false }: {
  name: string;
  label: string;
  hideLabel?: boolean;
  options: readonly T[];
  text: (o: T) => ReactNode;
  value: readonly T[];
  onChange: (v: T[]) => void;
  multi?: boolean;
  pick?: () => void;
  card?: boolean;
}) {
  // Só avança sozinho em clique/toque: navegar com as setas troca a seleção sem pular de passo.
  const pointer = useRef(false);
  return (
    <fieldset className={card ? "picks cards" : "picks"} onPointerDown={() => (pointer.current = true)} onKeyDown={() => (pointer.current = false)}>
      <legend className={hideLabel ? "sr" : undefined}>{label}</legend>
      <div className="picks-row">
        {options.map((o) => (
          <label key={o} className={card ? "pick-card" : "chip pick"}>
            <input
              type={multi ? "checkbox" : "radio"}
              name={name}
              value={o}
              checked={value.includes(o)}
              onChange={(e) => {
                onChange(multi ? (e.target.checked ? [...value, o] : value.filter((v) => v !== o)) : [o]);
                if (!multi && pointer.current) pick?.();
              }}
              // Clicar de novo na resposta que já estava marcada (voltando a um passo) também avança; não há onChange nesse caso.
              onClick={() => !multi && pointer.current && value.includes(o) && pick?.()}
            />
            {text(o)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function NameQ({ p, set, t }: QProps) {
  const first = p.name.trim().split(/\s+/)[0];
  return (
    <div className="q-name">
      <label className="field">
        <span className="sr">{t.name.label}</span>
        <input type="text" name="name" value={p.name} maxLength={80} autoComplete="name" onChange={(e) => set({ name: e.target.value })} />
      </label>
      <p className="hi" aria-live="polite">{first ? t.name.hi.replace("{name}", first) : " "}</p>
    </div>
  );
}

function FieldQ({ p, set, t, pick }: QProps) {
  return (
    <Picks name="field" label={t.field.h} hideLabel options={FIELDS} text={(f) => FIELD_LABELS[f]}
      value={p.field ? [p.field] : []} onChange={([field]) => set({ field })} pick={pick} />
  );
}

function SeniorityQ({ p, set, t, pick }: QProps) {
  return (
    <Picks name="seniority" label={t.seniority.h} hideLabel options={SENIORITIES} text={(s) => t.seniority[s]}
      value={p.seniority ? [p.seniority] : []} onChange={([seniority]) => set({ seniority })} pick={pick} />
  );
}

function StatusQ({ p, set, t, pick }: QProps) {
  return (
    <Picks card name="status" label={t.status.h} hideLabel options={STATUSES}
      text={(s) => <><b>{t.status[s]}</b><small>{t.status.sub[s]}</small></>}
      value={p.status ? [p.status] : []} onChange={([status]) => set({ status })} pick={pick} />
  );
}

function StackQ({ p, set, t }: QProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const has = (s: string) => p.stack.some((x) => same(x, s));
  const suggested = STACK_SUGGESTIONS[p.field ?? "software_engineering"];
  const extra = p.stack.filter((s) => !suggested.some((x) => same(x, s)));
  const full = p.stack.length >= MAX_STACK;
  const matches = open && q.trim() ? STACK_CATALOG.filter((s) => !has(s) && fold(s).includes(fold(q.trim()))).slice(0, 6) : [];

  // Enter sem destaque: "kub" vira "Kubernetes" (item do catálogo que tem esse nome ou começa assim); senão vale o texto digitado.
  const best = (text: string) => {
    const f = fold(text.trim());
    return matches.find((s) => fold(s) === f) ?? matches.find((s) => fold(s).startsWith(f)) ?? text;
  };
  const add = (items: string[]) => {
    set({ stack: addStack(p.stack, items) });
    setQ("");
    setHi(-1);
  };
  const remove = (s: string) => set({ stack: p.stack.filter((x) => !same(x, s)) });

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && matches.length) {
      e.preventDefault();
      setHi((hi + 1) % matches.length);
    } else if (e.key === "ArrowUp" && matches.length) {
      e.preventDefault();
      setHi((hi - 1 + matches.length) % matches.length);
    } else if ((e.key === "Enter" || e.key === ",") && q.trim()) {
      // Com texto, Enter adiciona. Vazio, o Enter segue e o formulário do wizard avança.
      e.preventDefault();
      add([hi >= 0 ? matches[hi] : best(q)]);
    } else if (e.key === "Escape" && matches.length) {
      e.preventDefault();
      setOpen(false);
      setHi(-1);
    } else if (e.key === "Backspace" && !q && p.stack.length) {
      set({ stack: p.stack.slice(0, -1) });
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (/[,;\n]/.test(pasted)) {
      e.preventDefault();
      add(pasted.split(/[,;\n]/));
    }
  };

  return (
    <div className="q-stack">
      <fieldset className="picks">
        <legend className="sr">{t.stack.h}</legend>
        <div className="picks-row">
          {suggested.map((s) => (
            <label key={s} className="chip pick">
              <input type="checkbox" checked={has(s)} disabled={full && !has(s)} onChange={() => (has(s) ? remove(s) : add([s]))} />
              {s}
            </label>
          ))}
          {extra.map((s) => (
            <span key={s} className="chip pick on added">
              {s}
              <button type="button" className="x" aria-label={t.stack.remove.replace("{item}", s)} onClick={() => remove(s)}>
                <Icon name="x" />
              </button>
            </span>
          ))}
        </div>
      </fieldset>
      <div className="combo">
        <label className="field">
          <span className="sr">{t.stack.add}</span>
          <input
            type="text"
            role="combobox"
            aria-expanded={matches.length > 0}
            aria-controls="stack-list"
            aria-autocomplete="list"
            aria-activedescendant={hi >= 0 ? `stack-opt-${hi}` : undefined}
            aria-describedby="stack-hint"
            data-autofocus
            value={q}
            placeholder={t.stack.add}
            maxLength={40}
            disabled={full}
            autoComplete="off"
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setHi(-1);
            }}
            onKeyDown={onKey}
            onPaste={onPaste}
            onBlur={() => setOpen(false)}
          />
        </label>
        {matches.length > 0 && (
          <ul id="stack-list" role="listbox" className="combo-list">
            {matches.map((s, i) => (
              <li key={s} id={`stack-opt-${i}`} role="option" aria-selected={i === hi} onMouseDown={(e) => { e.preventDefault(); add([s]); }}>
                {s}
              </li>
            ))}
          </ul>
        )}
        <small id="stack-hint" className="hint">{full ? t.stack.full : t.stack.hint}</small>
      </div>
    </div>
  );
}

function WhereQ({ p, set, t, countries }: QProps) {
  return (
    <div className="q-group">
      <Picks multi name="workModels" label={t.where.model} options={WORK_MODELS} text={(m) => t.where[m]} value={p.workModels}
        onChange={(workModels) => set({ workModels })} />
      <label className="field">
        {t.where.country}
        <select value={p.country ?? "BR"} onChange={(e) => set({ country: e.target.value })}>
          {countries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </label>
    </div>
  );
}

function KindQ({ p, set, t }: QProps) {
  return (
    <div className="q-group">
      <Picks multi name="contracts" label={t.kind.contract} options={CONTRACTS} text={(c) => t.kind[c]} value={p.contracts}
        onChange={(contracts) => set({ contracts })} />
    </div>
  );
}

function SalaryQ({ p, set, t, locale }: QProps) {
  const currency = p.currency ?? "BRL";
  const cfg = SALARY[currency];
  const min = p.salaryMin ?? cfg.from;
  const max = p.salaryMax ?? cfg.to;

  // A faixa inicial já conta como resposta: o usuário vê os valores e pode só continuar.
  useEffect(() => {
    if (p.currency == null || p.salaryMin == null || p.salaryMax == null) set({ currency, salaryMin: min, salaryMax: max });
  }, []);

  const fmt = new Intl.NumberFormat(locale);
  const clamp = (v: number) => Math.min(Math.max(v, cfg.min), cfg.max);
  const pct = (v: number) => ((clamp(v) - cfg.min) / (cfg.max - cfg.min)) * 100;
  const digits = (s: string) => {
    const n = Number(s.replace(/\D/g, ""));
    return n > 0 ? n : null;
  };

  return (
    <div className="q-salary">
      <fieldset className="seg-pick">
        <legend className="sr">{t.salary.currency}</legend>
        {CURRENCIES.map((c) => (
          <label key={c}>
            <input type="radio" name="currency" checked={c === currency}
              onChange={() => set({ currency: c, salaryMin: SALARY[c].from, salaryMax: SALARY[c].to })} />
            {c}
          </label>
        ))}
      </fieldset>

      <div className="range" style={{ "--a": `${pct(min)}%`, "--b": `${pct(max)}%` } as CSSProperties}>
        {/* Dois ranges sobrepostos. O de mínimo sobe para cima quando está na metade direita, para os pontos nunca travarem um no outro. */}
        <input type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={clamp(min)} aria-label={t.salary.min}
          aria-valuetext={`${cfg.symbol} ${fmt.format(min)}`} style={{ zIndex: pct(min) > 50 ? 2 : 0 }}
          onChange={(e) => set({ salaryMin: Math.min(Number(e.target.value), max) })} />
        <input type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={clamp(max)} aria-label={t.salary.max}
          aria-valuetext={`${cfg.symbol} ${fmt.format(max)}`} style={{ zIndex: 1 }}
          onChange={(e) => set({ salaryMax: Math.max(Number(e.target.value), min) })} />
      </div>

      <div className="amounts">
        <label className="money">
          <span className="sr">{t.salary.min}</span>
          <i aria-hidden="true">{cfg.symbol}</i>
          <input type="text" inputMode="numeric" value={p.salaryMin == null ? "" : fmt.format(p.salaryMin)}
            onChange={(e) => set({ salaryMin: digits(e.target.value) })} />
        </label>
        <span>{t.salary.to}</span>
        <label className="money">
          <span className="sr">{t.salary.max}</span>
          <i aria-hidden="true">{cfg.symbol}</i>
          <input type="text" inputMode="numeric" value={p.salaryMax == null ? "" : fmt.format(p.salaryMax)}
            onChange={(e) => set({ salaryMax: digits(e.target.value) })} />
        </label>
      </div>
      <p className="hint">{t.salary.lead}</p>
    </div>
  );
}

export const QUESTIONS: Record<Step, (props: QProps) => ReactNode> = {
  name: NameQ,
  field: FieldQ,
  seniority: SeniorityQ,
  stack: StackQ,
  status: StatusQ,
  where: WhereQ,
  kind: KindQ,
  salary: SalaryQ,
};

// Uma linha de texto por passo, para o resumo da tela final.
export function summary(step: Step, p: Profile, t: Dict["ob"], locale: string, countries: [string, string][]): string {
  const fmt = new Intl.NumberFormat(locale);
  const country = countries.find(([c]) => c === p.country)?.[1] ?? p.country;
  switch (step) {
    case "name":
      return p.name.trim();
    case "field":
      return p.field ? FIELD_LABELS[p.field] : "";
    case "seniority":
      return p.seniority ? t.seniority[p.seniority] : "";
    case "stack":
      return p.stack.join(", ");
    case "status":
      return p.status ? t.status[p.status] : "";
    case "where":
      return [...p.workModels.map((m) => t.where[m]), country].join(" · ");
    case "kind":
      return p.contracts.map((k) => t.kind[k]).join(" · ");
    case "salary":
      return p.currency && p.salaryMin != null && p.salaryMax != null
        ? `${SALARY[p.currency].symbol} ${fmt.format(p.salaryMin)} – ${fmt.format(p.salaryMax)} ${t.salary.perMonth}`
        : "";
  }
}
