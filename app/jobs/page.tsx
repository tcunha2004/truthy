import Link from "next/link";
import { Suspense } from "react";
import { SaveJob } from "../client";
import { getCompanies, type Company } from "../db";
import { Icon } from "../icons";
import { ago, dicts, getLang, locales, type Dict } from "../i18n";
import { embedQuery, getJobCountries, searchJobs, type JobGroup } from "../job-data";
import { forYouFilters, forYouQuery, forYouScope, forYouStack, type ForYouFilters } from "../for-you";
import { MAX_QUERY, NO_FILTERS, activeFilters, groupPay, jobsHref, pageCount, parseJobParams, payText, type JobFilters, type RawParams } from "../job-query";
import { FIELD_LABELS, SENIORITIES, countryOptions, type Profile } from "../profile-options";
import { getProfile } from "../profile";
import { Checking, JobRow, Logo, where } from "../job-row";
import { getSavedIds } from "../saved";
import { requireUser } from "../session";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].jobs.title} · truthy` };
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  const user = await requireUser();
  const lang = await getLang();
  const locale = locales[lang];
  const t = dicts[lang].jobs;
  const tj = dicts[lang].job;
  const [companies, present] = await Promise.all([getCompanies(), getJobCountries()]);
  const f = parseJobParams(await searchParams, companies.map((c) => c.slug));

  // Para você: o perfil vira a frase do embedding e os filtros duros. Busca normal: só o que foi digitado.
  const profile = f.mode === "forYou" ? await getProfile(user.id, user.name) : null;
  const fy = profile && forYouFilters(profile);
  const bySlug = new Map(companies.map((c) => [c.slug, c]));
  // Só países que aparecem em alguma vaga; códigos fora do ISO somem aqui em vez de virar opção quebrada.
  const countries = countryOptions(locale).filter(([code]) => present.includes(code));
  const lastRead = companies.reduce<Date | null>((max, c) => (c.lastFetchedAt && (!max || c.lastFetchedAt > max) ? c.lastFetchedAt : max), null);
  const num = new Intl.NumberFormat(locale);
  const active = activeFilters(f);
  const clearHref = jobsHref({ ...NO_FILTERS, q: f.q });
  const meta = profile && forYouMeta(profile, locale, t, dicts[lang].ob.where);
  // A parte lenta (embedding na OpenAI + busca) não segura a página: o topo sai na hora e o resto chega por streaming.
  // Criada por último, para nenhum throw acima deixar a promise sem ninguém esperando.
  const results = loadResults(user.id, f, profile ? forYouQuery(profile) : f.q || null, fy);

  return (
    <main className="co-page">
      <section className="co-hero">
        <div className="wrap">
          {fy && meta ? (
            <>
              <h1>{t.forYouH}</h1>
              <p className="lead">{t.forYouLead[forYouScope(fy)]}</p>
              <div className="filters">
                <Link className="chip on" href="/jobs?search=1" aria-label={t.forYouOff}>
                  <Icon name="spark" />{t.forYou}<Icon name="x" />
                </Link>
              </div>
              <p className="fy-meta">{meta}<Link href="/profile">{t.editProfile}</Link></p>
            </>
          ) : (
            <>
              <h1>{t.h}</h1>
              <p className="lead">{t.lead}</p>

              {/* key: "Limpar filtros" e a paginação navegam no cliente; remontar o form realinha os campos com a URL */}
              <form key={jobsHref(f)} className="jobs-form" role="search" action="/jobs">
                <input type="hidden" name="search" value="1" />
                <div className="search one">
                  <Link className="chip" href="/jobs"><Icon name="spark" />{t.forYou}</Link>
                  <label>
                    <Icon name="search" />
                    <input type="search" name="q" defaultValue={f.q} maxLength={MAX_QUERY} aria-label={t.q} placeholder={t.qPh} />
                  </label>
                  <button className="btn" type="submit">{t.cta}</button>
                </div>

                <details className="jf" open={active > 0}>
                  <summary>
                    {t.filters}
                    {active > 0 && <span className="num">· {(active === 1 ? t.activeOne : t.activeMany).replace("{n}", num.format(active))}</span>}
                    <Icon name="chev" />
                  </summary>
                  <div className="jf-body">
                    <fieldset className="picks">
                      <legend>{t.workModel}</legend>
                      <div className="picks-row">
                        <label className="chip pick">
                          <input type="checkbox" name="remote" value="1" defaultChecked={f.remote} />
                          {t.remote}
                        </label>
                      </div>
                    </fieldset>
                    <div className="jf-row">
                      <label className="field">
                        {t.seniority}
                        <select name="seniority" defaultValue={f.seniority ?? ""}>
                          <option value="">{t.anySeniority}</option>
                          {SENIORITIES.map((s) => <option key={s} value={s}>{t.levels[s]}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        {t.country}
                        <select name="country" defaultValue={f.country ?? ""}>
                          <option value="">{t.anyCountry}</option>
                          {countries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                        </select>
                      </label>
                      <label className="field">
                        {t.company}
                        <select name="company" defaultValue={f.company ?? ""}>
                          <option value="">{t.anyCompany}</option>
                          {companies.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                        </select>
                      </label>
                    </div>
                    <div className="jf-actions">
                      <button className="btn sm" type="submit">{t.apply}</button>
                      {active > 0 && <Link className="btn sm quiet" href={clearHref}>{t.clear}</Link>}
                    </div>
                  </div>
                </details>
              </form>
            </>
          )}

          <Suspense fallback={<Checking text={fy ? t.loadingForYou : t.loading} />}>
            {results.then(({ vector, total, groups }) => (
              <>
                {fy ? !vector && <p className="jf-notice" role="status">{t.forYouDown}</p> : f.q && !vector && <p className="jf-notice" role="status">{t.textDown}</p>}
                <p className="prov">
                  <span className="pulse" aria-hidden="true" />
                  <span>
                    {[groups.length > 0 && `${num.format(total)} ${total === 1 ? t.one : t.many}`, lastRead && `${t.checked} ${ago(lastRead, lang)}`, "Lever\u00a0· Greenhouse"]
                      .filter(Boolean)
                      .join("\u00a0· ")}
                  </span>
                </p>
              </>
            ))}
          </Suspense>
        </div>
      </section>

      <div className="co-stage">
        <Suspense>
          {results.then(({ total, groups, savedIds }) => {
            const pages = pageCount(total);
            return groups.length > 0 ? (
              <>
                <div className="jobs jobs-list">
                  {groups.map((g) => (
                    <GroupRow key={`${g.slug}/${g.title}`} g={g} co={bySlug.get(g.slug)} savedIds={savedIds} locale={locale} t={t} tj={tj} />
                  ))}
                </div>
                {pages > 1 && (
                  <nav className="pager" aria-label={t.pages}>
                    {f.page > 1 ? <Link className="back" href={jobsHref({ ...f, page: f.page - 1 })}><Icon name="chev" />{t.prev}</Link> : <span />}
                    <span className="num">{t.pageOf.replace("{n}", num.format(f.page)).replace("{total}", num.format(pages))}</span>
                    {f.page < pages ? <Link href={jobsHref({ ...f, page: f.page + 1 })}>{t.next}<Icon name="chev" /></Link> : <span />}
                  </nav>
                )}
              </>
            ) : f.page > 1 ? (
              <div className="empty">
                <b>{t.beyondH}</b>
                <p>{t.beyondP}</p>
                <Link className="btn quiet sm" href={jobsHref({ ...f, page: 1 })}>{t.first}</Link>
              </div>
            ) : fy ? (
              <div className="empty">
                <b>{t.forYouEmptyH}</b>
                <p>{t.forYouEmptyP}</p>
                <Link className="btn quiet sm" href="/profile">{t.editProfile}</Link>
                <Link className="btn quiet sm" href="/jobs?search=1">{t.searchOwn}</Link>
              </div>
            ) : (
              <div className="empty">
                <b>{t.emptyH}</b>
                <p>{active > 0 ? t.emptyFiltersP : t.emptyP}</p>
                {active > 0 && <Link className="btn quiet sm" href={clearHref}>{t.clear}</Link>}
              </div>
            );
          })}
        </Suspense>
      </div>
    </main>
  );
}

async function loadResults(userId: string, f: JobFilters, phrase: string | null, fy: ForYouFilters | null) {
  const vector = phrase ? await embedQuery(phrase) : null;
  const { total, groups } = await searchJobs(f, vector, fy);
  const savedIds = await getSavedIds(userId, groups.flatMap((g) => g.versions.map((v) => v.id)));
  return { vector, total, groups, savedIds };
}

// Linha de resumo do perfil no Para você: área · nível · modelos · país · stack. O país vem da lista completa:
// a da página só tem países que aparecem em vagas, e o do usuário pode não estar nela.
function forYouMeta(p: Profile, locale: string, t: Dict["jobs"], where: Dict["ob"]["where"]) {
  const { shown, more } = forYouStack(p.stack);
  const country = countryOptions(locale).find(([code]) => code === p.country)?.[1] ?? p.country;
  const stack = shown.join(", ") + (more > 0 ? ` ${t.moreStack.replace("{n}", String(more))}` : "");
  return [FIELD_LABELS[p.field!], t.levels[p.seniority!], ...p.workModels.map((m) => where[m]), country, stack].join("\u00a0· ");
}

function GroupRow({ g, co, savedIds, locale, t, tj }: {
  g: JobGroup; co: Company | undefined; savedIds: Set<string>; locale: string; t: Dict["jobs"]; tj: Dict["job"];
}) {
  if (g.versions.length === 1) {
    const v = g.versions[0];
    return <JobRow v={v} title={g.title} company={g.company} co={co} saved={savedIds.has(v.id)} locale={locale} t={t} tj={tj} />;
  }

  const ats = co?.ats ?? "";
  const pay = groupPay(g.versions, locale);
  const status = (
    <span className="status">
      <Icon name="check" className="ck" />
      <b>{tj.openVia} {ats}</b>
    </span>
  );
  const payCell = (
    <div className="pay num">
      {pay === "varies" ? t.payVaries : pay ?? "—"}
      <small>{pay === "varies" ? t.byLocation : pay ? tj.perMonth : tj.noPay}</small>
    </div>
  );

  return (
    <details className="job-group">
      <summary className="job">
        <Logo co={co} name={g.company} />
        <div>
          <h3>{g.title}</h3>
          <div className="meta">
            <span>{g.company}</span>
            <span><Icon name="pin" />{t.locations.replace("{n}", new Intl.NumberFormat(locale).format(g.versions.length))}</span>
            {status}
          </div>
        </div>
        {payCell}
        <span className="caret" aria-hidden="true"><Icon name="chev" /></span>
      </summary>
      <ul className="versions">
        {g.versions.map((v) => (
          <li key={v.id}>
            <span className="where"><Icon name={v.isRemote ? "globe" : "pin"} />{where(v, t)}</span>
            {payText(v, locale) ? <span className="pay num">{payText(v, locale)}</span> : <span className="pay missing">{tj.noPay}</span>}
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {t.applyVia.replace("{ats}", ats)}<span className="sr"> {t.newTab}</span>
            </a>
            <SaveJob jobId={v.id} saved={savedIds.has(v.id)} t={tj} />
          </li>
        ))}
      </ul>
    </details>
  );
}
