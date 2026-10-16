// Opções do perfil e validação. Puro (sem Next, React ou banco): roda no servidor, no cliente e no `node --test`.
// Os CHECK de db/init/004_profiles.sql repetem estas listas; mude os dois juntos.

export const FIELDS = ["software_engineering", "data_science", "data_engineering", "ml_ai", "devops_sre", "mobile", "qa", "security", "product_design", "product_management"] as const;
export const SENIORITIES = ["intern", "junior", "mid", "senior", "staff", "manager"] as const;
export const STATUSES = ["active", "open", "exploring"] as const;
export const WORK_MODELS = ["remote", "hybrid", "onsite"] as const;
export const REGIONS = ["br", "intl"] as const;
export const CONTRACTS = ["clt", "pj", "contractor"] as const;
export const COMPANY_TYPES = ["big_tech", "startup", "established", "consultancy", "any"] as const;
export const CURRENCIES = ["BRL", "USD", "EUR"] as const;
export const STEPS = ["name", "field", "seniority", "stack", "status", "where", "kind", "salary"] as const;

export type Field = (typeof FIELDS)[number];
export type Seniority = (typeof SENIORITIES)[number];
export type SearchStatus = (typeof STATUSES)[number];
export type WorkModel = (typeof WORK_MODELS)[number];
export type Region = (typeof REGIONS)[number];
export type Contract = (typeof CONTRACTS)[number];
export type CompanyType = (typeof COMPANY_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export type Step = (typeof STEPS)[number];
export type ProfileError = "required" | "invalid" | "tooLong" | "tooMany" | "range";

export type Profile = {
  name: string;
  field: Field | null;
  seniority: Seniority | null;
  stack: string[];
  status: SearchStatus | null;
  workModels: WorkModel[];
  regions: Region[];
  country: string | null;
  city: string | null;
  contracts: Contract[];
  companyTypes: CompanyType[];
  currency: Currency | null;
  salaryMin: number | null;
  salaryMax: number | null;
};

export const EMPTY_PROFILE: Profile = {
  name: "",
  field: null,
  seniority: null,
  stack: [],
  status: null,
  workModels: [],
  regions: [],
  country: "BR",
  city: null,
  contracts: [],
  companyTypes: [],
  currency: null,
  salaryMin: null,
  salaryMax: null,
};

// Nomes de área ficam em inglês nos dois idiomas, como o mercado usa.
export const FIELD_LABELS: Record<Field, string> = {
  software_engineering: "Software Engineering",
  data_science: "Data Science",
  data_engineering: "Data Engineering",
  ml_ai: "ML / AI",
  devops_sre: "DevOps / SRE",
  mobile: "Mobile",
  qa: "QA",
  security: "Security",
  product_design: "Product Design",
  product_management: "Product Management",
};

export const SALARY_CAP = 1_000_000;
export const MAX_STACK = 30;
export const SALARY: Record<Currency, { symbol: string; min: number; max: number; step: number; from: number; to: number }> = {
  BRL: { symbol: "R$", min: 1000, max: 50000, step: 500, from: 8000, to: 15000 },
  USD: { symbol: "US$", min: 500, max: 25000, step: 250, from: 4000, to: 8000 },
  EUR: { symbol: "€", min: 500, max: 25000, step: 250, from: 4000, to: 8000 },
};

export const STACK_SUGGESTIONS: Record<Field, string[]> = {
  software_engineering: ["TypeScript", "JavaScript", "React", "Node.js", "Next.js", "Java", "Spring", "Python", "Go", "C#", ".NET", "SQL", "PostgreSQL", "AWS", "Docker"],
  data_science: ["Python", "SQL", "Pandas", "NumPy", "scikit-learn", "R", "Jupyter", "Statistics", "TensorFlow", "PyTorch", "Power BI", "Tableau"],
  data_engineering: ["Python", "SQL", "Spark", "Airflow", "dbt", "Kafka", "Databricks", "Snowflake", "BigQuery", "AWS", "Scala", "Terraform"],
  ml_ai: ["Python", "PyTorch", "TensorFlow", "scikit-learn", "LLMs", "Hugging Face", "MLOps", "SQL", "Docker", "Kubernetes", "AWS", "LangChain"],
  devops_sre: ["Kubernetes", "Docker", "Terraform", "AWS", "GCP", "Azure", "Linux", "CI/CD", "Prometheus", "Grafana", "Go", "Python"],
  mobile: ["Swift", "Kotlin", "React Native", "Flutter", "Dart", "iOS", "Android", "TypeScript", "Firebase", "GraphQL", "Jetpack Compose", "SwiftUI"],
  qa: ["Cypress", "Playwright", "Selenium", "Jest", "Postman", "JavaScript", "TypeScript", "Python", "Java", "API testing", "Appium", "CI/CD"],
  security: ["AppSec", "Cloud Security", "Pentest", "SIEM", "IAM", "OWASP", "Python", "AWS", "Kubernetes", "Burp Suite", "ISO 27001", "Linux"],
  product_design: ["Figma", "Design Systems", "Prototyping", "User Research", "UX Writing", "Accessibility", "Framer", "Usability Testing", "Miro", "HTML/CSS", "Motion", "Maze"],
  product_management: ["Roadmapping", "Discovery", "Analytics", "SQL", "Jira", "A/B Testing", "OKRs", "Amplitude", "Mixpanel", "Figma", "Agile", "Stakeholder Management"],
};

const EXTRA_STACK = [
  "Angular", "Vue.js", "Svelte", "Nuxt", "Remix", "Astro", "Tailwind CSS", "Sass", "Redux", "Vite", "Webpack",
  "Express", "NestJS", "Fastify", "Deno", "Bun", "Django", "Flask", "FastAPI", "Ruby", "Rails", "PHP", "Laravel",
  "Elixir", "Phoenix", "Rust", "C", "C++", "Kotlin Multiplatform", "Objective-C", "Scala", "Clojure", "Haskell",
  "MySQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Cassandra", "SQLite", "Supabase", "Prisma",
  "RabbitMQ", "gRPC", "REST", "Microservices", "Serverless", "Kubernetes Operators", "Helm", "Ansible", "Pulumi",
  "GitHub Actions", "GitLab CI", "Jenkins", "ArgoCD", "Datadog", "New Relic", "OpenTelemetry", "Nginx",
  "Cloudflare", "Vercel", "Heroku", "Looker", "Metabase", "Excel", "Hadoop", "Flink", "Delta Lake", "Redshift",
  "Keras", "OpenCV", "XGBoost", "MLflow", "Vertex AI", "SageMaker", "RAG", "Vector Databases", "Storybook",
  "Testing Library", "Vitest", "Mocha", "JUnit", "pytest", "k6", "Sketch", "Adobe XD", "Webflow", "Notion",
];

export const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

export const STACK_CATALOG = [...new Set([...Object.values(STACK_SUGGESTIONS).flat(), ...EXTRA_STACK])].sort((a, b) => fold(a).localeCompare(fold(b)));

// "node", "NodeJS" e "node.js" viram a mesma chave ("node"); "JS" sozinho continua "js".
const stackKey = (s: string) => fold(s).replace(/[\s.\-]/g, "").replace(/(.)js$/, "$1");
const CANON = new Map(STACK_CATALOG.map((s) => [stackKey(s), s]));

export const canonicalStack = (s: string) => CANON.get(stackKey(s.trim())) ?? s.trim();

// Aparar, trocar pelo nome canônico, tirar vazios e repetidos (ignorando maiúsculas). Sem limite de tamanho.
export function normalizeStack(items: string[]): string[] {
  const out: string[] = [];
  for (const raw of items) {
    const s = canonicalStack(raw);
    if (s && !out.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
  }
  return out;
}

// Usado pela UI: junta itens novos, corta cada um em 40 caracteres e para em MAX_STACK.
export const addStack = (current: string[], items: string[]) => normalizeStack([...current, ...items.map((s) => s.slice(0, 40))]).slice(0, MAX_STACK);

// "Sem preferência" é exclusivo: marcá-lo limpa os outros; marcar outro limpa ele.
export const exclusiveAny = (prev: CompanyType[], next: CompanyType[]): CompanyType[] =>
  next.includes("any") && !prev.includes("any") ? ["any"] : next.filter((t) => t !== "any");

// ISO 3166-1 alfa-2 (códigos atuais).
export const COUNTRIES = (
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ " +
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR " +
  "GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP " +
  "KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT " +
  "MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW " +
  "SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG " +
  "UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW"
).split(" ");

// Rodar no servidor e passar por props: Intl do Node e do navegador podem divergir e quebrar a hidratação.
export function countryOptions(locale: string): [string, string][] {
  const names = new Intl.DisplayNames([locale], { type: "region" });
  return COUNTRIES.map((c): [string, string] => [c, names.of(c) ?? c]).sort((a, b) => a[1].localeCompare(b[1], locale));
}

// ---------- validação (fronteira de confiança: o input vem do cliente) ----------

export type Parsed<T> = { ok: true; value: T } | { ok: false; step: Step; error: ProfileError };

type Input = Record<string, unknown>;
type Fail = { error: ProfileError };

const fail = (error: ProfileError): Fail => ({ error });
const failed = (v: unknown): v is Fail => typeof v === "object" && v !== null && !Array.isArray(v) && "error" in v;
const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const isIn = <T extends string>(list: readonly T[], v: unknown): v is T => (list as readonly unknown[]).includes(v);

function one<T extends string>(list: readonly T[], v: unknown): T | Fail {
  if (v == null || v === "") return fail("required");
  return isIn(list, v) ? v : fail("invalid");
}

function many<T extends string>(list: readonly T[], v: unknown): T[] | Fail {
  if (!Array.isArray(v) || !v.length) return fail("required");
  if (!v.every((x) => isIn(list, x))) return fail("invalid");
  return [...new Set(v as T[])];
}

const money = (v: unknown) => (Number.isInteger(v) && (v as number) >= 1 && (v as number) <= SALARY_CAP ? (v as number) : null);

const PARSERS: Record<Step, (o: Input) => Partial<Profile> | Fail> = {
  name: (o) => {
    const name = text(o.name);
    return !name ? fail("required") : name.length > 80 ? fail("tooLong") : { name };
  },
  field: (o) => {
    const field = one(FIELDS, o.field);
    return failed(field) ? field : { field };
  },
  seniority: (o) => {
    const seniority = one(SENIORITIES, o.seniority);
    return failed(seniority) ? seniority : { seniority };
  },
  stack: (o) => {
    if (!Array.isArray(o.stack) || !o.stack.every((s) => typeof s === "string")) return fail("required");
    const stack = normalizeStack(o.stack);
    if (!stack.length) return fail("required");
    if (stack.some((s) => s.length > 40)) return fail("tooLong");
    if (stack.length > MAX_STACK) return fail("tooMany");
    return { stack };
  },
  status: (o) => {
    const status = one(STATUSES, o.status);
    return failed(status) ? status : { status };
  },
  where: (o) => {
    const workModels = many(WORK_MODELS, o.workModels);
    if (failed(workModels)) return workModels;
    const regions = many(REGIONS, o.regions);
    if (failed(regions)) return regions;
    const country = one(COUNTRIES, typeof o.country === "string" ? o.country.toUpperCase() : o.country);
    if (failed(country)) return country;
    const needsCity = workModels.some((m) => m !== "remote");
    const city = text(o.city);
    if (needsCity && !city) return fail("required");
    if (city.length > 80) return fail("tooLong");
    return { workModels, regions, country, city: needsCity ? city : null };
  },
  kind: (o) => {
    const contracts = many(CONTRACTS, o.contracts);
    if (failed(contracts)) return contracts;
    const companyTypes = many(COMPANY_TYPES, o.companyTypes);
    if (failed(companyTypes)) return companyTypes;
    if (companyTypes.includes("any") && companyTypes.length > 1) return fail("invalid");
    return { contracts, companyTypes };
  },
  salary: (o) => {
    const currency = one(CURRENCIES, o.currency);
    if (failed(currency)) return currency;
    if (o.salaryMin == null || o.salaryMax == null) return fail("required");
    const salaryMin = money(o.salaryMin);
    const salaryMax = money(o.salaryMax);
    if (salaryMin == null || salaryMax == null) return fail("invalid");
    if (salaryMin > salaryMax) return fail("range");
    return { currency, salaryMin, salaryMax };
  },
};

// Valida e normaliza só os campos de um passo.
export function parseStep(step: Step, input: unknown): Parsed<Partial<Profile>> {
  const o = typeof input === "object" && input !== null ? (input as Input) : {};
  const r = PARSERS[step](o);
  return failed(r) ? { ok: false, step, error: r.error } : { ok: true, value: r };
}

// Valida o perfil inteiro; o erro aponta o primeiro passo que falhou.
export function parseProfile(input: unknown): Parsed<Profile> {
  const value = {} as Profile;
  for (const step of STEPS) {
    const r = parseStep(step, input);
    if (!r.ok) return r;
    Object.assign(value, r.value);
  }
  return { ok: true, value };
}

export const firstIncomplete = (p: Profile): Step | "done" => STEPS.find((s) => !parseStep(s, p).ok) ?? "done";

// Passo em que o wizard abre: o pedido na URL, se não estiver depois do primeiro incompleto.
export function initialStep(p: Profile, requested?: string): Step | "done" {
  const order: readonly string[] = [...STEPS, "done"];
  const first = order.indexOf(firstIncomplete(p));
  const want = requested ? order.indexOf(requested) : -1;
  return order[want >= 0 && want <= first ? want : first] as Step | "done";
}
