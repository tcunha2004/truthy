import Link from "next/link";
import { getCompanies, type Company } from "../db";
import { ago, dicts, getLang, locales } from "../i18n";
import { Checking, JobRow, Stream } from "../job-row";
import { getAppliedJobs, type AppliedJob } from "../applied";
import { requireUser } from "../session";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].applied.title} · truthy` };
}

// Abertas em cima, fechadas embaixo; cada seção da candidatura mais recente para a mais antiga.
export default async function AppliedPage() {
  const user = await requireUser();
  const lang = await getLang();
  const locale = locales[lang];
  const t = dicts[lang];
  const num = new Intl.NumberFormat(locale);
  // A lista vem pelo Stream: se demorar, o título sai antes e o carregamento fica só aqui embaixo.
  const data = Promise.all([getAppliedJobs(user.id), getCompanies()]);

  const section = (id: string, heading: string, items: AppliedJob[], bySlug: Map<string, Company>) => items.length > 0 && (
    <section className="applied-sec" aria-labelledby={id}>
      <h2 id={id}>{heading} <span className="num">{num.format(items.length)}</span></h2>
      <div className="jobs jobs-list">
        {items.map((j) => {
          const co = bySlug.get(j.slug);
          const closedText = j.open
            ? undefined
            : t.job.closedVia.replace("{ats}", co?.ats ?? "").replace("{ago}", j.closedAt ? ago(j.closedAt, lang) : "").trim();
          return <JobRow key={j.id} v={j} title={j.title} company={j.company} co={co} applied closed={closedText} locale={locale} t={t.jobs} tj={t.job} />;
        })}
      </div>
    </section>
  );

  return (
    <main className="co-page">
      <section className="co-hero">
        <div className="wrap">
          <h1>{t.applied.h}</h1>
          <p className="lead">{t.applied.lead}</p>
        </div>
      </section>
      <div className="co-stage">
        <Stream data={data} fallback={<div className="empty"><Checking text={t.applied.loading} /></div>}>
          {([jobs, companies]) => {
            const bySlug = new Map(companies.map((c) => [c.slug, c]));
            return jobs.length > 0 ? (
              <>
                {section("applied-open", t.applied.openH, jobs.filter((j) => j.open), bySlug)}
                {section("applied-closed", t.applied.closedH, jobs.filter((j) => !j.open), bySlug)}
              </>
            ) : (
              <div className="empty">
                <b>{t.applied.emptyH}</b>
                <p>{t.applied.emptyP}</p>
                <Link className="btn quiet sm" href="/jobs">{t.applied.browse}</Link>
              </div>
            );
          }}
        </Stream>
      </div>
    </main>
  );
}
