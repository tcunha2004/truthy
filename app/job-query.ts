// Funções puras da /jobs: lê a URL como filtros, monta links de volta e formata salário.
// Sem imports do Next ou do banco, para o `node --test` conseguir carregar.

export const PAGE_SIZE = 20;
export const MAX_QUERY = 300;
// Limita o OFFSET: um page=1e15 digitado à mão estouraria o bigint do Postgres.
export const MAX_PAGE = 1000;

// "forYou" lista pelo perfil, sem digitar nada; "search" é a busca normal. A URL decide (ver parseJobParams).
export type JobMode = "forYou" | "search";
export type JobFilters = { q: string; remote: boolean; country: string | null; company: string | null; page: number; mode: JobMode };
export const NO_FILTERS: JobFilters = { q: "", remote: false, country: null, company: null, page: 1, mode: "search" };

// Qualquer um destes na URL, com qualquer valor, é a busca normal. Sem nenhum (ou só page), é "Para você".
const SEARCH_KEYS = ["search", "q", "remote", "country", "company"] as const;

export type RawParams = Record<string, string | string[] | undefined>;
// O Next entrega array quando o parâmetro se repete (?country=BR&country=US): vale o primeiro.
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// A URL vem de qualquer um: valor inválido é descartado, nunca vira erro.
export function parseJobParams(raw: RawParams, companySlugs: readonly string[]): JobFilters {
  const country = first(raw.country) ?? "";
  const company = first(raw.company) ?? "";
  const page = Number(first(raw.page));
  return {
    q: (first(raw.q) ?? "").trim().slice(0, MAX_QUERY).trim(),
    remote: first(raw.remote) === "1",
    country: /^[A-Z]{2}$/.test(country) ? country : null,
    company: companySlugs.includes(company) ? company : null,
    page: Number.isInteger(page) && page >= 1 ? Math.min(page, MAX_PAGE) : 1,
    mode: SEARCH_KEYS.some((k) => raw[k] !== undefined) ? "search" : "forYou",
  };
}

export const activeFilters = (f: JobFilters) => [f.remote, f.country, f.company].filter(Boolean).length;

// Link para /jobs com esses filtros; valores vazios e page 1 ficam fora da URL. No Para você só vale a page.
// Na busca, search=1 mantém o modo quando nenhum outro parâmetro sobraria (busca vazia).
export function jobsHref(f: JobFilters): string {
  const p = new URLSearchParams();
  if (f.mode === "search") {
    if (f.q) p.set("q", f.q);
    if (f.remote) p.set("remote", "1");
    if (f.country) p.set("country", f.country);
    if (f.company) p.set("company", f.company);
    if (!p.size) p.set("search", "1");
  }
  if (f.page > 1) p.set("page", String(f.page));
  const s = p.toString();
  return s ? `/jobs?${s}` : "/jobs";
}

export const pageCount = (total: number) => Math.max(1, Math.ceil(total / PAGE_SIZE));

export type Pay = { salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null };

// "€4,000 – €5,000", ou null quando a fonte não informou. Moeda malformada vinda da fonte conta como
// ausente: deixar o Intl lançar RangeError derrubaria a página inteira.
export function payText(p: Pay, locale: string): string | null {
  const nums = [p.salaryMin, p.salaryMax].filter((n): n is number => n != null && Number.isFinite(n));
  if (!p.salaryCurrency || !nums.length) return null;
  let fmt: Intl.NumberFormat;
  try {
    fmt = new Intl.NumberFormat(locale, { style: "currency", currency: p.salaryCurrency, maximumFractionDigits: 0 });
  } catch {
    return null;
  }
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo === hi ? fmt.format(lo) : fmt.formatRange(lo, hi);
}

// Um salário só para o grupo quando todos os locais pagam igual; senão a linha diz que varia.
export function groupPay(versions: Pay[], locale: string): string | null | "varies" {
  const texts = new Set(versions.map((v) => payText(v, locale)));
  return texts.size === 1 ? [...texts][0] : "varies";
}

// id de vaga vindo do cliente (o pg devolve bigint como texto): só dígitos, sem zero à esquerda, e cabe no bigint.
export const isJobId = (v: unknown): v is string =>
  typeof v === "string" && /^[1-9]\d{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n;
