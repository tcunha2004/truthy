import { db } from "./db";
import type { JobVersion } from "./job-data";

// Leituras das vagas salvas. Só páginas do servidor chamam isto, sempre com o id da sessão.
// Não pode virar "use server": exportaria funções que aceitam qualquer userId vindo do cliente.

export type SavedJob = JobVersion & { title: string; company: string; slug: string; open: boolean; closedAt: Date | null };

// Quais destas vagas o usuário salvou, para pintar os marcadores da página atual.
export async function getSavedIds(userId: string, jobIds: string[]): Promise<Set<string>> {
  if (!jobIds.length) return new Set();
  const { rows } = await db.query(
    `SELECT job_id::text AS id FROM saved_jobs WHERE user_id = $1 AND job_id = ANY ($2::bigint[])`,
    [userId, jobIds],
  );
  return new Set(rows.map((r) => r.id));
}

// Tudo o que o usuário salvou, do mais recente para o mais antigo. Fechada = is_active falso ou apagada;
// closedAt é quando isso aconteceu (updated_at só move quando o conteúdo muda, ver 006_jobs_updated_at.sql).
export async function getSavedJobs(userId: string): Promise<SavedJob[]> {
  const { rows } = await db.query(
    `SELECT j.id::text AS id, j.title, j.url, j.location, j.is_remote AS "isRemote",
            j.salary_min::float8 AS "salaryMin", j.salary_max::float8 AS "salaryMax", j.salary_currency AS "salaryCurrency",
            c.name AS company, c.slug,
            (j.is_active AND j.deleted_at IS NULL) AS open,
            CASE WHEN j.is_active AND j.deleted_at IS NULL THEN NULL ELSE coalesce(j.deleted_at, j.updated_at) END AS "closedAt"
     FROM saved_jobs s
     JOIN jobs j ON j.id = s.job_id
     JOIN companies c ON c.id = j.company_id
     WHERE s.user_id = $1
     ORDER BY s.created_at DESC`,
    [userId],
  );
  return rows;
}
