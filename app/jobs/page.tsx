import Link from "next/link";
import { getCompanies, type Company } from "../db";
import { Icon } from "../icons";
import { ago, dicts, getLang, locales, type Dict } from "../i18n";
import { embedQuery, getJobCountries, searchJobs, type JobGroup, type JobVersion } from "../job-data";
import { MAX_QUERY, NO_FILTERS, activeFilters, groupPay, jobsHref, pageCount, parseJobParams, payText, type RawParams } from "../job-query";
import { countryOptions } from "../profile-options";
import { requireUser } from "../session";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].jobs.title} · truthy` };
}

export default async function JobsPage({ searchParams }: { searchParams: Promise<RawParams> }) {
  await requireUser();
  const lang = await getLang();
  const locale = locales[lang];
  const t = dicts[lang].jobs;
  const tj = dicts[lang].job;
  const companies = await getCompanies();
  const f = parseJobParams(await searchParams, companies.map((c) => c.slug));

  const vector = f.q ? await embedQuery(f.q) : null;
  const [{ total, groups }, present] = await Promise.all([searchJobs(f, vector), getJobCountries()]);

  const bySlug = new Map(companies.map((c) => [c.slug, c]));
  // Só países que aparecem em alguma vaga; códigos fora do ISO somem aqui em vez de virar opção quebrada.
  const countries = countryOptions(locale).filter(([code]) => present.includes(code));
  const lastRead = companies.reduce<Date | null>((max, c) => (c.lastFetchedAt && (!max || c.lastFetchedAt > max) ? c.lastFetchedAt : max), null);
  const num = new Intl.NumberFormat(locale);
  const active = activeFilters(f);
  const pages = pageCount(total);
  const clearHref = jobsHref({ ...NO_FILTERS, q: f.q });

  return (
    <main className="co-page">
      <section className="co-hero">
        <div className="wrap">
          <h1>{t.h}</h1>
          <p className="lead">{t.lead}</p>

          {/* key: "Limpar filtros" e a paginação navegam no cliente; remontar o form realinha os campos com a URL */}
          <form key={jobsHref(f)} className="jobs-form" role="search" action="/jobs">
            <div className="search one">
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
                <fieldset className="picks">
                  <legend>{t.origin}</legend>
                  <div className="picks-row">
                    {(["", "nacional", "internacional"] as const).map((k) => (
                      <label key={k || "all"} className="chip pick">
                        <input type="radio" name="kind" value={k} defaultChecked={(f.kind ?? "") === k} />
                        {k ? t[k] : t.all}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="jf-row">
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

          {f.q && !vector && <p className="jf-notice" role="status">{t.textDown}</p>}
          <p className="prov">
            <span className="pulse" aria-hidden="true" />
            <span>
              {[groups.length > 0 && `${num.format(total)} ${total === 1 ? t.one : t.many}`, lastRead && `${t.checked} ${ago(lastRead, lang)}`, "Lever · Greenhouse"]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </p>
        </div>
      </section>

      <div className="co-stage">
        {groups.length > 0 ? (
          <>
            <div className="jobs jobs-list">
              {groups.map((g) => (
                <GroupRow key={`${g.slug}/${g.title}`} g={g} co={bySlug.get(g.slug)} locale={locale} t={t} tj={tj} />
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
        ) : (
          <div className="empty">
            <b>{t.emptyH}</b>
            <p>{active > 0 ? t.emptyFiltersP : t.emptyP}</p>
            {active > 0 && <Link className="btn quiet sm" href={clearHref}>{t.clear}</Link>}
          </div>
        )}
      </div>
    </main>
  );
}

// "Remoto · Brasil". Não repete "Remoto" quando o local já diz isso ("Remote, Brasil").
function where(v: JobVersion, t: Dict["jobs"]) {
  const place = v.location ?? t.noLocation;
  return v.isRemote && !/remot/i.test(place) ? `${t.remoteAt} · ${place}` : place;
}

function Logo({ co, name }: { co: Company | undefined; name: string }) {
  return co?.logo
    ? <img className="logo" src={co.logo} alt="" width={44} height={44} />
    : <div className="logo" aria-hidden="true">{name[0]}</div>;
}

function GroupRow({ g, co, locale, t, tj }: { g: JobGroup; co: Company | undefined; locale: string; t: Dict["jobs"]; tj: Dict["job"] }) {
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

  if (g.versions.length === 1) {
    const v = g.versions[0];
    return (
      <article className="job">
        <Logo co={co} name={g.company} />
        <div>
          <h3>
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {g.title}<span className="sr"> {t.newTab}</span>
            </a>
          </h3>
          <div className="meta">
            <span>{g.company}</span>
            <span><Icon name={v.isRemote ? "globe" : "pin"} />{where(v, t)}</span>
            {status}
          </div>
        </div>
        {payCell}
      </article>
    );
  }

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
        {g.versions.map((v, i) => (
          <li key={`${v.url}#${i}`}>
            <span className="where"><Icon name={v.isRemote ? "globe" : "pin"} />{where(v, t)}</span>
            <span className="pay num">{payText(v, locale) ?? tj.noPay}</span>
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {t.applyVia.replace("{ats}", ats)}<span className="sr"> {t.newTab}</span>
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}
