import { existsSync } from "node:fs";
import { join } from "node:path";
import { Pool } from "pg";

// One pool per process; the global keeps dev hot reloads from opening new ones.
const g = globalThis as unknown as { pool?: Pool };
export const db = (g.pool ??= new Pool({ connectionString: process.env.DATABASE_URL }));

export type Company = {
  slug: string;
  name: string;
  ats: string;
  lastFetchedAt: Date | null;
  open: number;
  logo: string | null;
};

const ats = (s: string) => s[0].toUpperCase() + s.slice(1);
const logoFor = (slug: string) => {
  const file = `/logos/${slug.toLowerCase()}.webp`;
  return existsSync(join(process.cwd(), "public", file)) ? file : null;
};

export async function getCompanies(): Promise<Company[]> {
  const { rows } = await db.query(`
    SELECT c.slug, c.name, s.name AS ats, c.last_fetched_at,
           count(j.id) FILTER (WHERE j.is_active AND j.deleted_at IS NULL)::int AS open
    FROM companies c
    JOIN sources s ON s.id = c.source_id
    LEFT JOIN jobs j ON j.company_id = c.id
    WHERE c.deleted_at IS NULL
    GROUP BY c.id, s.name
    ORDER BY open DESC, c.name`);
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    ats: ats(r.ats),
    lastFetchedAt: r.last_fetched_at,
    open: r.open,
    logo: logoFor(r.slug),
  }));
}
