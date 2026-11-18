"use server";

import { db } from "./db";
import { isJobId } from "./job-query";
import { getUser } from "./session";

// Marca a vaga como aplicada depois que o usuário confirma no aviso. Repetir não muda nada (ON CONFLICT).
// Não exige vaga aberta: ela pode ter fechado entre o clique e a confirmação, e a candidatura aconteceu.
export async function markApplied(jobId: string): Promise<boolean> {
  const user = await getUser();
  if (!user || !isJobId(jobId)) return false;
  try {
    await db.query(`INSERT INTO applied_jobs (user_id, job_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [user.id, jobId]);
    return true;
  } catch (err) {
    console.error("markApplied:", err);
    return false;
  }
}
