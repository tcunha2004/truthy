import { cookies, headers } from "next/headers";

export type Lang = "en" | "pt";

const en = {
  meta: {
    title: "truthy — jobs that return true",
    description: "No sponsored posts, just jobs that return true. Tech jobs pulled straight from each company's own hiring system.",
  },
  nav: {
    main: "Main",
    jobs: "Jobs",
    companies: "Companies",
    saved: "Saved",
    signin: "Sign in",
    language: "Language",
    toDark: "Switch to dark theme",
    toLight: "Switch to light theme",
  },
  hero: {
    h1: "Jobs that return",
    sub: "No sponsored posts. Every listing comes straight from the company’s own hiring system.",
    q: "Role, skill or company",
    loc: "Anywhere",
    locLabel: "Location",
    cta: "Search jobs",
    filters: "Quick filters",
    remote: "Remote",
    br: "Brazil",
    intl: "International",
    salary: "Shows salary",
    // ponytail: sample time, comes from max(companies.last_fetched_at) once the DB is wired
    prov: "Sources checked 12 min ago · Lever · Greenhouse",
  },
  job: {
    checking: "Checking source…",
    openVia: "Open · via",
    closed: "Closed · removed from Lever 2h ago",
    noPay: "Salary not listed",
    perMonth: "per month",
    save: "Save job",
    saved: "Saved",
    note: "Sample listings for this preview. Companies are real; roles and salaries are illustrative.",
  },
  ads: {
    h: "Nobody pays to be on top.",
    lead: "There is no promoted slot on truthy. The job you see first is first because it fits your search.",
    l1: "Sponsored posts",
    l1s: "Not one, ever.",
    l2: "Where listings come from",
    l2s: "The company’s own Lever or Greenhouse board.",
    l3: "What happens when a job closes",
    l3s: "It leaves truthy on the next check.",
  },
  tiles: {
    t1: "Straight from the source.",
    t1p: "truthy reads each company’s official hiring board. No reposts, no scraped copies, no middlemen.",
    board: "Greenhouse board",
    api: "official API",
    checked: "checked 12 min ago",
    you: "You",
    apply: "apply on the company’s page",
    t2: "Closed means gone.",
    t2p: "When a company takes a job down, truthy marks it closed. No ghost listings collecting applications.",
    open: "Open",
    closed: "Closed",
  },
  co: {
    h: "Pick a company. See every opening.",
    lead: "Each company page lists only its open jobs, and when its board was last read.",
    all: "Browse all companies",
  },
  foot: "No sponsored posts, just jobs that return true.",
  companies: {
    title: "Companies",
    h: "Every company, read from its own board.",
    lead: "Pick one to see all of its open jobs, straight from its Lever or Greenhouse board.",
    boardsRead: "Boards read",
    count: "companies",
    search: "Search companies",
    filters: "Filter companies",
    all: "All",
    nacional: "Brazilian",
    internacional: "International",
    where: { nacional: "Brazil", internacional: "International" },
    openOne: "open job",
    openMany: "open jobs",
    boardRead: "Board read",
    notRead: "Board not read yet",
    emptyH: "No company matches that.",
    emptyP: "Try another name, or clear the search to see all of them.",
    clear: "Clear search",
  },
  auth: {
    login: "Sign in",
    signup: "Create account",
    modes: "Sign in or create an account",
    loginH: "Sign in to truthy.",
    loginLead: "Your saved jobs are waiting, and you’ll see which ones still return",
    signupH: "Create your truthy account.",
    signupLead: "Save jobs and keep track of which ones are still open.",
    name: "Name",
    email: "Email",
    emailPh: "you@email.com",
    password: "Password",
    passwordHint: "Use at least 8 characters.",
    or: "or",
    google: "Continue with Google",
  },
};

export type Dict = typeof en;

const pt: Dict = {
  meta: {
    title: "truthy — vagas que retornam true",
    description: "Sem posts patrocinados, só vagas que retornam true. Vagas de tech direto do sistema de recrutamento de cada empresa.",
  },
  nav: {
    main: "Principal",
    jobs: "Vagas",
    companies: "Empresas",
    saved: "Salvas",
    signin: "Entrar",
    language: "Idioma",
    toDark: "Mudar para o tema escuro",
    toLight: "Mudar para o tema claro",
  },
  hero: {
    h1: "Vagas que retornam",
    sub: "Sem posts patrocinados. Toda vaga vem direto do sistema de recrutamento da própria empresa.",
    q: "Cargo, skill ou empresa",
    loc: "Qualquer lugar",
    locLabel: "Localização",
    cta: "Buscar vagas",
    filters: "Filtros rápidos",
    remote: "Remoto",
    br: "Brasil",
    intl: "Internacional",
    salary: "Com salário",
    prov: "Fontes verificadas há 12 min · Lever · Greenhouse",
  },
  job: {
    checking: "Verificando a fonte…",
    openVia: "Aberta · via",
    closed: "Fechada · removida da Lever há 2h",
    noPay: "Salário não informado",
    perMonth: "por mês",
    save: "Salvar vaga",
    saved: "Salva",
    note: "Vagas de exemplo para esta prévia. As empresas são reais; cargos e salários são ilustrativos.",
  },
  ads: {
    h: "Ninguém paga para aparecer no topo.",
    lead: "Não existe espaço patrocinado no truthy. A primeira vaga que você vê é a que mais combina com a sua busca.",
    l1: "Posts patrocinados",
    l1s: "Nenhum, nunca.",
    l2: "De onde vêm as vagas",
    l2s: "Do board oficial da empresa na Lever ou Greenhouse.",
    l3: "Quando uma vaga fecha",
    l3s: "Ela sai do truthy na próxima verificação.",
  },
  tiles: {
    t1: "Direto da fonte.",
    t1p: "O truthy lê o board oficial de cada empresa. Sem repost, sem cópia, sem intermediário.",
    board: "board na Greenhouse",
    api: "API oficial",
    checked: "verificado há 12 min",
    you: "Você",
    apply: "se candidata na página da empresa",
    t2: "Fechou, sumiu.",
    t2p: "Quando a empresa tira a vaga do ar, o truthy marca como fechada. Nada de vaga fantasma recebendo currículo.",
    open: "Aberta",
    closed: "Fechada",
  },
  co: {
    h: "Escolha uma empresa. Veja todas as vagas.",
    lead: "Cada página de empresa mostra só as vagas abertas e quando o board foi lido pela última vez.",
    all: "Ver todas as empresas",
  },
  foot: "Sem posts patrocinados, só vagas que retornam true.",
  companies: {
    title: "Empresas",
    h: "Cada empresa, lida direto do próprio board.",
    lead: "Escolha uma para ver todas as vagas abertas, direto do board dela na Lever ou na Greenhouse.",
    boardsRead: "Boards lidos",
    count: "empresas",
    search: "Buscar empresa",
    filters: "Filtrar empresas",
    all: "Todas",
    nacional: "Brasileiras",
    internacional: "Internacionais",
    where: { nacional: "Brasil", internacional: "Internacional" },
    openOne: "vaga aberta",
    openMany: "vagas abertas",
    boardRead: "Board lido",
    notRead: "Board ainda não lido",
    emptyH: "Nenhuma empresa com esse nome.",
    emptyP: "Tente outro nome ou limpe a busca para ver todas.",
    clear: "Limpar busca",
  },
  auth: {
    login: "Entrar",
    signup: "Criar conta",
    modes: "Entrar ou criar uma conta",
    loginH: "Entre no truthy.",
    loginLead: "Suas vagas salvas estão te esperando, e você vê quais ainda retornam",
    signupH: "Crie sua conta no truthy.",
    signupLead: "Salve vagas e acompanhe quais continuam abertas.",
    name: "Nome",
    email: "E-mail",
    emailPh: "voce@email.com",
    password: "Senha",
    passwordHint: "Use pelo menos 8 caracteres.",
    or: "ou",
    google: "Continuar com o Google",
  },
};

export const dicts = { en, pt };
export const locales: Record<Lang, string> = { en: "en", pt: "pt-BR" };

// Saved choice (cookie) wins; otherwise follow the browser's language.
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get("lang")?.value;
  if (saved === "en" || saved === "pt") return saved;
  return (await headers()).get("accept-language")?.toLowerCase().startsWith("pt") ? "pt" : "en";
}

// "2 hours ago" / "há 2 horas"
export function ago(d: Date, lang: Lang) {
  const s = (d.getTime() - Date.now()) / 1000;
  const [v, unit] = Math.abs(s) < 3600 ? [s / 60, "minute"] as const : Math.abs(s) < 86400 ? [s / 3600, "hour"] as const : [s / 86400, "day"] as const;
  return new Intl.RelativeTimeFormat(locales[lang], { numeric: "auto" }).format(Math.round(v), unit);
}
