import { Suspense } from "react";
import { CompanyBrowser, type CompanyCard } from "../client";
import { getCompanies, type Company } from "../db";
import { ago, dicts, getLang, locales } from "../i18n";
import { NO_FILTERS, jobsHref } from "../job-query";
import { Checking } from "../job-row";
import { getUser } from "../session";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].companies.title} · truthy` };
}

// Deslogado vê as empresas reais (como a landing) com contagens e horários de exemplo.
const SAMPLE_OPEN = [27, 18, 34, 22, 39, 16, 31, 25, 15, 36];
const sample = (companies: Company[]): Company[] => {
  const read = new Date(Date.now() - 12 * 60_000);
  return [...companies]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c, i) => ({ ...c, open: SAMPLE_OPEN[i % SAMPLE_OPEN.length], lastFetchedAt: read }));
};

export default async function CompaniesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const lang = await getLang();
  const t = dicts[lang].companies;
  const user = await getUser();
  const initialQuery = (await searchParams).q ?? "";
  const num = new Intl.NumberFormat(locales[lang]);
  // As empresas chegam por streaming: o título sai na hora e o carregamento fica só na grade.
  // Criada depois dos awaits, para nenhum throw deixar a promise sem ninguém esperando.
  const data = getCompanies().then((real) => summarize(user ? real : sample(real)));

  // Cartões da grade + totais da linha de proveniência.
  function summarize(companies: Company[]) {
    const cards: CompanyCard[] = companies.map((c) => ({
      slug: c.slug,
      // Vagas da empresa com o filtro já aplicado. Deslogado vai direto ao login, como o link "Vagas" da nav.
      href: user ? jobsHref({ ...NO_FILTERS, company: c.slug }) : "/login",
      name: c.name,
      logo: c.logo,
      meta: c.ats,
      open: num.format(c.open),
      openLabel: c.open === 1 ? t.openOne : t.openMany,
      read: c.lastFetchedAt ? `${t.cardChecked} ${ago(c.lastFetchedAt, lang)}` : t.notChecked,
    }));

    const lastRead = companies.reduce<Date | null>((max, c) => (c.lastFetchedAt && (!max || c.lastFetchedAt > max) ? c.lastFetchedAt : max), null);
    const totalOpen = companies.reduce((sum, c) => sum + c.open, 0);
    return { cards, count: companies.length, lastRead, totalOpen };
  }

  return (
    <main className="co-page">
      <section className="co-hero">
        <div className="wrap">
          <h1>{t.h}</h1>
          <p className="lead">{t.lead}</p>
          <Suspense>
            {data.then(({ count, lastRead, totalOpen }) => (
              <p className="prov">
                <span className="pulse" aria-hidden="true" />
                <span>{[lastRead && `${t.checked} ${ago(lastRead, lang)}`, `${num.format(count)} ${t.count}`, `${num.format(totalOpen)} ${t.openMany}`]
                  .filter(Boolean)
                  .join("\u00a0· ")}</span>
              </p>
            ))}
          </Suspense>
          {!user && <p className="co-sample">{t.sample}</p>}
        </div>
      </section>
      <Suspense fallback={<div className="co-stage"><div className="empty"><Checking text={t.loading} /></div></div>}>
        {data.then(({ cards }) => <CompanyBrowser companies={cards} initialQuery={initialQuery} t={t} />)}
      </Suspense>
    </main>
  );
}
