import { cached, stored } from "./cache";
import { db } from "./db";
import type { ForYouFilters } from "./for-you";
import { PAGE_SIZE, type JobFilters, type Pay } from "./job-query";

// Tem que ser o mesmo modelo do worker (truthy-worker/internal/service/openai.go): vetores de modelos diferentes não se comparam.
const EMBEDDING_MODEL = "text-embedding-3-small";

export type JobVersion = Pay & { id: string; url: string; location: string | null; isRemote: boolean | null };
export type JobGroup = { title: string; company: string; slug: string; versions: JobVersion[] };

// Vetor da frase no formato texto do pgvector ("[0.1,…]"), ou null sem chave ou se a OpenAI falhar.
// Com null a página continua de pé: lista por data e avisa que a busca por texto está indisponível.
// Em cache por frase: trocar de página ou de filtro com a mesma busca não chama a OpenAI de novo.
// Memória primeiro (200 vetores ≈ 6 MB), depois Redis por 30 dias (sobrevive a restart; ~30 KB por frase).
// O modelo vai na chave: trocou o modelo, os vetores antigos não são reaproveitados.
export const embedQuery = cached(stored(`emb:${EMBEDDING_MODEL}:`, 30 * 86400, fetchEmbedding), 200);

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

// Corte de relevância: com busca por texto, só entram grupos a até RELEVANCE_CUTOFF da distância do melhor
// resultado (já com os filtros). Relativo e não absoluto porque frases curtas têm distâncias sempre maiores:
// a melhor vaga para "react" fica a 0,65, mais longe que lixo para frases longas.
// Calibrado para text-embedding-3-small em 2026-10-16 (+0,15 escondia vagas reais de iOS e Salesforce).
// Trocou o modelo, recalibre.
const RELEVANCE_CUTOFF = 0.18;

// Um SQL só: filtra, agrupa por empresa + título, corta pela relevância, ordena e pagina. Com vetor ($1),
// ordena pela versão mais próxima do grupo; sem vetor, dist é NULL em todos, nada é cortado e vale a
// publicação mais recente. O corte é por grupo, para não sumir com locais de um grupo que entrou.
// slug e title no fim desempatam, para a paginação não repetir nem pular grupos.
// $8 é a senioridade (do perfil no "Para você", do filtro na busca). Na busca o filtro é estrito; no "Para você" ($12)
// vaga sem nível detectado também passa, porque o nível do perfil é sempre preenchido e esconderia boa parte das vagas.
// $9–$11 são os filtros do "Para você" (for-you.ts); nulos na busca normal.
const SEARCH_SQL = `
WITH hits AS (
  SELECT j.id, j.company_id, j.title, j.url, j.location, j.is_remote,
         j.salary_min, j.salary_max, j.salary_currency, j.published_at,
         CASE WHEN $1::vector IS NULL THEN NULL ELSE j.embedding <=> $1::vector END AS dist
  FROM jobs j
  JOIN companies c ON c.id = j.company_id
  WHERE j.is_active AND j.deleted_at IS NULL AND c.deleted_at IS NULL
    AND ($1::vector IS NULL OR j.embedding IS NOT NULL)
    AND (NOT $2::boolean OR j.is_remote)
    AND ($3::text IS NULL OR $3::text = ANY (j.countries))
    AND ($4::text IS NULL OR c.slug = $4::text)
    AND ($8::text IS NULL OR j.seniority = $8::text OR ($12::boolean AND j.seniority IS NULL))
    AND ($9::text IS NULL
         OR ($10::boolean AND j.is_remote AND (j.countries IS NULL OR $9::text = ANY (j.countries)))
         OR ($11::boolean AND j.is_remote IS NOT TRUE AND $9::text = ANY (j.countries)))
),
grouped AS (
  SELECT h.company_id, h.title, min(h.dist) AS dist, max(h.published_at) AS published_at,
         json_agg(json_build_object(
           'id', h.id::text, 'url', h.url, 'location', h.location, 'isRemote', h.is_remote,
           'salaryMin', h.salary_min, 'salaryMax', h.salary_max, 'salaryCurrency', h.salary_currency
         ) ORDER BY h.dist NULLS LAST, h.published_at DESC NULLS LAST) AS versions
  FROM hits h
  GROUP BY h.company_id, h.title
)
SELECT g.title, c.name AS company, c.slug, g.versions, count(*) OVER ()::int AS total
FROM grouped g
JOIN companies c ON c.id = g.company_id
WHERE g.dist IS NULL OR g.dist <= (SELECT min(dist) FROM grouped) + $7::float8
ORDER BY g.dist NULLS LAST, g.published_at DESC NULLS LAST, c.slug, g.title
LIMIT $5 OFFSET $6`;

export async function searchJobs(f: JobFilters, vector: string | null, fy: ForYouFilters | null): Promise<{ total: number; groups: JobGroup[] }> {
  const { rows } = await db.query(SEARCH_SQL, [vector, f.remote, f.country, f.company, PAGE_SIZE, (f.page - 1) * PAGE_SIZE, RELEVANCE_CUTOFF,
    fy?.seniority ?? f.seniority, fy?.country ?? null, fy?.remote ?? false, fy?.local ?? false, fy !== null]);
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
