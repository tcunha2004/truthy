import { CompanyBrowser, type CompanyCard } from "../client";
import { getCompanies } from "../db";
import { ago, dicts, getLang, locales } from "../i18n";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].companies.title} · truthy` };
}

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const lang = await getLang();
  const t = dicts[lang].companies;
  const companies = await getCompanies();
  const num = new Intl.NumberFormat(locales[lang]);

  const cards: CompanyCard[] = companies.map((c) => ({
    slug: c.slug,
    name: c.name,
    kind: c.kind,
    logo: c.logo,
    meta: [c.kind && t.where[c.kind], c.ats].filter(Boolean).join(" · "),
    open: num.format(c.open),
    openLabel: c.open === 1 ? t.openOne : t.openMany,
    read: c.lastFetchedAt ? `${t.boardRead} ${ago(c.lastFetchedAt, lang)}` : t.notRead,
  }));

  const lastRead = companies.reduce<Date | null>((max, c) => (c.lastFetchedAt && (!max || c.lastFetchedAt > max) ? c.lastFetchedAt : max), null);
  const totalOpen = companies.reduce((sum, c) => sum + c.open, 0);

  return (
    <main className="co-page">
      <section className="co-hero">
        <div className="wrap">
          <h1>{t.h}</h1>
          <p className="lead">{t.lead}</p>
          <p className="prov">
            <span className="pulse" aria-hidden="true" />
            <span>{[lastRead && `${t.boardsRead} ${ago(lastRead, lang)}`, `${num.format(companies.length)} ${t.count}`, `${num.format(totalOpen)} ${t.openMany}`]
              .filter(Boolean)
              .join(" · ")}</span>
          </p>
        </div>
      </section>
      <CompanyBrowser companies={cards} initialQuery={(await searchParams).q ?? ""} t={t} />
    </main>
  );
}
