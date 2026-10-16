import { redirect } from "next/navigation";
import { db } from "./db";
import { EMPTY_PROFILE, STEPS, parseProfile, parseStep, type Profile, type ProfileError, type Step } from "./profile-options";
import { getUser } from "./session";

export type SaveResult = { ok: true } | { ok: false; step: Step; error: ProfileError };

// Chave do Profile → coluna de profiles. Nomes de coluna no SQL vêm só daqui, nunca do input.
const COLUMNS = {
  field: "field",
  seniority: "seniority",
  stack: "stack",
  status: "search_status",
  workModels: "work_models",
  country: "country",
  contracts: "contracts",
  currency: "salary_currency",
  salaryMin: "salary_min",
  salaryMax: "salary_max",
} as const;
type Column = keyof typeof COLUMNS;

export async function getProfile(userId: string, name: string | null): Promise<Profile> {
  const select = Object.entries(COLUMNS).map(([key, col]) => `${col} AS "${key}"`).join(", ");
  const { rows } = await db.query(`SELECT ${select} FROM profiles WHERE user_id = $1`, [userId]);
  const row = rows[0] ?? {};
  return { ...EMPTY_PROFILE, ...row, country: row.country ?? EMPTY_PROFILE.country, name: name ?? "" };
}

// Grava nome (users) e o resto (profiles) numa transação. onboard = marca o perfil como completo.
async function write(userId: string, values: Partial<Profile>, onboard = false) {
  const { name, ...rest } = values;
  const keys = Object.keys(rest) as Column[];
  const cols: string[] = keys.map((k) => COLUMNS[k]);
  const params: unknown[] = [userId, ...keys.map((k) => rest[k])];
  const placeholders = params.map((_, i) => `$${i + 1}`);
  const sets = cols.map((c, i) => `${c} = $${i + 2}`);
  if (onboard) {
    cols.push("onboarded_at");
    placeholders.push("now()");
    sets.push("onboarded_at = COALESCE(profiles.onboarded_at, now())");
  }

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    if (name !== undefined) await client.query(`UPDATE users SET name = $2 WHERE id = $1`, [userId, name]);
    if (sets.length) {
      await client.query(
        `INSERT INTO profiles (user_id, ${cols.join(", ")}) VALUES (${placeholders.join(", ")})
         ON CONFLICT (user_id) DO UPDATE SET ${sets.join(", ")}`,
        params,
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

// Salva um passo do wizard. Serve só para retomar depois: o finish() reenvia tudo.
export async function saveStep(step: Step, input: unknown): Promise<SaveResult> {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");
  if (!STEPS.includes(step)) return { ok: false, step: "name", error: "invalid" };
  const r = parseStep(step, input);
  if (!r.ok) return r;
  await write(user.id, r.value);
  return { ok: true };
}

// Fim do onboarding: valida o perfil inteiro, grava e marca onboarded_at. O cliente navega depois do ok.
export async function finish(input: unknown): Promise<SaveResult> {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");
  const r = parseProfile(input);
  if (!r.ok) return r;
  await write(user.id, r.value, true);
  return { ok: true };
}

// Edição pela página de perfil: mesma validação, sem mexer em onboarded_at.
export async function saveProfile(input: unknown): Promise<SaveResult> {
  "use server";
  const user = await getUser();
  if (!user) redirect("/login");
  const r = parseProfile(input);
  if (!r.ok) return r;
  await write(user.id, r.value);
  return { ok: true };
}
