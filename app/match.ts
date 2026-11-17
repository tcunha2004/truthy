// Análise de compatibilidade por IA (perfil × vaga). Puro: sem Next, banco, Redis ou SDK; roda no node --test.
// match-data.ts liga as dependências reais.
import { createHash } from "node:crypto";
import { FIELD_LABELS, type Profile } from "./profile-options.ts";

// i18n.ts importa next/headers e não roda no node --test.
type Lang = "en" | "pt";

export type Match = { score: number; matching: string[]; missing: string[] };
export type MatchState = { kind: "ok"; match: Match } | { kind: "limited"; minutes: number } | { kind: "unavailable" };
export type MatchJob = {
  id: string;
  title: string;
  company: string;
  description: string | null;
  seniority: string | null;
  stack: string[] | null;
  location: string | null;
  isRemote: boolean | null;
  countries: string[] | null;
};
export type MatchDeps = {
  mget(keys: string[]): Promise<(string | null)[]>;
  take(): Promise<{ ok: true } | { ok: false; minutes: number }>;
  jobs(ids: string[]): Promise<MatchJob[]>;
  analyze(job: MatchJob): Promise<Match>;
  save(key: string, value: string): Promise<void>;
};

export const MATCH_DESC_CHARS = 4000;
export const MATCH_TOP = 10;
const MAX_ITEMS = 6;
const MAX_ITEM_CHARS = 60;

export const MATCH_PROMPT = `You compare a job candidate's profile with a job posting.
Return JSON with:
- score: a number from 0 to 10, with one decimal, for how well the candidate fits what the job asks for.
- matching: skills, experience and attributes the job asks for that the candidate has.
- missing: what the job asks for that the candidate lacks.
Items are short (2-4 words, e.g. "Go", "5+ years of experience", "Fluent English"), at most 6 per list, most important first.
Use only what the posting says; never invent requirements it does not state.
Write the items in the answer language given in the input.`;

export const MATCH_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    score: { type: "number" },
    matching: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
  },
  required: ["score", "matching", "missing"],
  additionalProperties: false,
};

const ENTITIES: Record<string, string> = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

// &amp; por último: assim "&amp;lt;" vira "&lt;" e não "<".
export const stripHtml = (html: string): string =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/&(lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e])
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") continue;
    const s = item.trim().slice(0, MAX_ITEM_CHARS);
    if (!s || seen.has(s.toLowerCase())) continue;
    seen.add(s.toLowerCase());
    out.push(s);
    if (out.length === MAX_ITEMS) break;
  }
  return out;
}

// A resposta do modelo (ou do cache) nunca vai crua para a tela.
export function normalizeMatch(raw: unknown): Match | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.score !== "number" || !Number.isFinite(r.score)) return null;
  const score = Math.round(Math.min(10, Math.max(0, r.score)) * 10) / 10;
  return { score, matching: cleanList(r.matching), missing: cleanList(r.missing) };
}

// Hash só dos campos que vão ao modelo: nome e status não mudam a análise.
export function matchPrefix(lang: Lang, p: Profile): string {
  const fields = [p.field, p.seniority, p.stack, p.workModels, p.country, p.contracts, p.currency, p.salaryMin, p.salaryMax];
  return `match:v1:${lang}:${createHash("sha256").update(JSON.stringify(fields)).digest("hex")}:`;
}

const line = (label: string, v: string | null | undefined) => (v ? `${label}: ${v}` : null);
const list = (v: string[] | null) => (v?.length ? v.join(", ") : null);

export function matchInput(lang: Lang, p: Profile, job: MatchJob): string {
  const hasSalary = p.currency && (p.salaryMin != null || p.salaryMax != null);
  const salary = hasSalary ? `${p.salaryMin ?? ""}–${p.salaryMax ?? ""} ${p.currency}/month` : null;
  const desc = job.description ? stripHtml(job.description).slice(0, MATCH_DESC_CHARS) : null;
  return [
    `Answer language: ${lang === "pt" ? "Portuguese (Brazil)" : "English"}`,
    "",
    "Candidate:",
    line("Field", p.field && FIELD_LABELS[p.field]),
    line("Seniority", p.seniority),
    line("Stack", list(p.stack)),
    line("Work models", list(p.workModels)),
    line("Country", p.country),
    line("Contracts", list(p.contracts)),
    line("Salary", salary),
    "",
    "Job:",
    line("Title", job.title),
    line("Company", job.company),
    line("Seniority", job.seniority),
    line("Location", job.location),
    line("Remote", job.isRemote == null ? null : job.isRemote ? "yes" : "no"),
    line("Countries", list(job.countries)),
    line("Stack", list(job.stack)),
    line("Description", desc),
  ]
    .filter((l) => l !== null)
    .join("\n");
}

function parseCached(v: string): Match | null {
  try {
    return normalizeMatch(JSON.parse(v));
  } catch {
    return null;
  }
}

// Uma promise por vaga, que nunca rejeita. Um MGET, no máximo um take() e uma leitura do banco por chamada.
// Redis fora no MGET ou no take() → nada vai ao modelo (fail closed: sem contador, sem gasto).
export function matchAll(ids: string[], prefix: string, deps: MatchDeps): Map<string, Promise<MatchState>> {
  const unavailable: MatchState = { kind: "unavailable" };
  const gate = (async () => {
    const raw = await deps.mget(ids.map((id) => prefix + id));
    const cached = new Map<string, Match>();
    raw.forEach((v, i) => {
      const hit = v && parseCached(v);
      if (hit) cached.set(ids[i], hit);
    });
    const missing = ids.filter((id) => !cached.has(id));
    if (missing.length === 0) return { cached, missing: new Map<string, MatchState | MatchJob>() };
    const t = await deps.take().catch(() => null);
    const rest = new Map<string, MatchState | MatchJob>();
    if (!t) missing.forEach((id) => rest.set(id, unavailable));
    else if (!t.ok) missing.forEach((id) => rest.set(id, { kind: "limited", minutes: t.minutes }));
    else {
      // banco fora não derruba as que já estavam no cache
      const rows = new Map((await deps.jobs(missing).catch(() => [])).map((j) => [j.id, j]));
      missing.forEach((id) => rest.set(id, rows.get(id) ?? unavailable));
    }
    return { cached, missing: rest };
  })().catch(() => null);

  return new Map(
    ids.map((id) => [
      id,
      gate
        .then(async (g): Promise<MatchState> => {
          if (!g) return unavailable;
          const hit = g.cached.get(id);
          if (hit) return { kind: "ok", match: hit };
          const next = g.missing.get(id)!;
          if ("kind" in next) return next;
          const match = await deps.analyze(next);
          await deps.save(prefix + id, JSON.stringify(match)).catch(() => {});
          return { kind: "ok", match };
        })
        .catch(() => unavailable),
    ]),
  );
}
