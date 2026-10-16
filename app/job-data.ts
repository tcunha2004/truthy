import { cached } from "./cache";
import { db } from "./db";
import { PAGE_SIZE, type JobFilters, type Pay } from "./job-query";

// Tem que ser o mesmo modelo do worker (truthy-worker/internal/service/openai.go): vetores de modelos diferentes não se comparam.
const EMBEDDING_MODEL = "text-embedding-3-small";

export type JobVersion = Pay & { url: string; location: string | null; isRemote: boolean | null };
export type JobGroup = { title: string; company: string; slug: string; versions: JobVersion[] };

// Vetor da frase no formato texto do pgvector ("[0.1,…]"), ou null sem chave ou se a OpenAI falhar.
// Com null a página continua de pé: lista por data e avisa que a busca por texto está indisponível.
// Em cache por frase: trocar de página ou de filtro com a mesma busca não chama a OpenAI de novo.
// 200 vetores ≈ 6 MB de memória.
export const embedQuery = cached(fetchEmbedding, 200);

async function fetchEmbedding(q: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, input: q }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const json = await res.json();
    return JSON.stringify(json.data[0].embedding);
  } catch (err) {
    console.error("embed query:", err);
    return null;
  }
}

// Um SQL só: filtra, agrupa por empresa + título, ordena e pagina. Com vetor ($1), ordena pela versão
// mais próxima do grupo; sem vetor, min(dist) é NULL em todos e vale a publicação mais recente.
// slug e title no fim desempatam, para a paginação não repetir nem pular grupos.
const SEARCH_SQL = `
WITH hits AS (
  SELECT j.company_id, j.title, j.url, j.location, j.is_remote,
         j.salary_min, j.salary_max, j.salary_currency, j.published_at,
         CASE WHEN $1::vector IS NULL THEN NULL ELSE j.embedding <=> $1::vector END AS dist
  FROM jobs j
  JOIN companies c ON c.id = j.company_id
  WHERE j.is_active AND j.deleted_at IS NULL AND c.deleted_at IS NULL
    AND ($1::vector IS NULL OR j.embedding IS NOT NULL)
    AND (NOT $2::boolean OR j.is_remote)
    AND ($3::text IS NULL OR $3::text = ANY (j.countries))
    AND ($4::text IS NULL OR c.kind = $4::text)
    AND ($5::text IS NULL OR c.slug = $5::text)
)
SELECT h.title, c.name AS company, c.slug,
       json_agg(json_build_object(
         'url', h.url, 'location', h.location, 'isRemote', h.is_remote,
         'salaryMin', h.salary_min, 'salaryMax', h.salary_max, 'salaryCurrency', h.salary_currency
       ) ORDER BY h.dist NULLS LAST, h.published_at DESC NULLS LAST) AS versions,
       count(*) OVER ()::int AS total
FROM hits h
JOIN companies c ON c.id = h.company_id
GROUP BY h.company_id, h.title, c.name, c.slug
ORDER BY min(h.dist) NULLS LAST, max(h.published_at) DESC NULLS LAST, c.slug, h.title
LIMIT $6 OFFSET $7`;

export async function searchJobs(f: JobFilters, vector: string | null): Promise<{ total: number; groups: JobGroup[] }> {
  const { rows } = await db.query(SEARCH_SQL, [vector, f.remote, f.country, f.kind, f.company, PAGE_SIZE, (f.page - 1) * PAGE_SIZE]);
  return {
    total: rows[0]?.total ?? 0,
    groups: rows.map((r) => ({ title: r.title, company: r.company, slug: r.slug, versions: r.versions })),
  };
}

export async function getJobCountries(): Promise<string[]> {
  const { rows } = await db.query(
    `SELECT DISTINCT unnest(countries) AS code FROM jobs WHERE is_active AND deleted_at IS NULL ORDER BY 1`,
  );
  return rows.map((r) => r.code);
}
