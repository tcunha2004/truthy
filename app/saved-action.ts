"use server";

import { db } from "./db";
import { isJobId } from "./job-query";
import { getUser } from "./session";

// Ação do marcador de salvar, usada com useActionState: recebe o estado atual e devolve o estado real no banco.
// O form manda o estado desejado ("saved" = 1 ou 0), não "inverter": repetir o envio não muda o resultado.
// Qualquer falha devolve o estado anterior, e o marcador volta ao que era.
export async function setSaved(prev: boolean, form: FormData): Promise<boolean> {
  const user = await getUser();
  const jobId = form.get("jobId");
  if (!user || !isJobId(jobId)) return prev;
  try {
    if (form.get("saved") === "1") {
      // Só vaga aberta pode ser salva. Uma fechada que já estava salva continua salva.
      await db.query(
        `INSERT INTO saved_jobs (user_id, job_id)
         SELECT $1, id FROM jobs WHERE id = $2 AND is_active AND deleted_at IS NULL
         ON CONFLICT DO NOTHING`,
        [user.id, jobId],
      );
    } else {
      await db.query(`DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2`, [user.id, jobId]);
    }
    const { rows } = await db.query(
      `SELECT EXISTS (SELECT 1 FROM saved_jobs WHERE user_id = $1 AND job_id = $2) AS saved`,
      [user.id, jobId],
    );
    return rows[0].saved;
  } catch (err) {
    console.error("setSaved:", err);
    return prev;
  }
}
