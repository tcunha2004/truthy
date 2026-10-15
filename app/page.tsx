import Link from "next/link";
import { OpenStatus, SaveButton, SearchForm } from "./client";
import { Icon } from "./icons";
import { getCompanies } from "./db";
import { dicts, getLang, locales } from "./i18n";

type Pay = { cur: string; min: number; max: number } | null;

// ponytail: sample rows until the jobs query exists; companies are real (db/init/002_seed.sql), roles and pay are illustrative and labeled on the page.
const sampleJobs: { logo: string; title: string; company: string; remote: boolean; where: [string, string]; ats: string; pay: Pay; saved?: boolean; closed?: boolean }[] = [
  { logo: "A", title: "Senior Software Engineer, Backend", company: "Airbnb", remote: true, where: ["Remote · Brazil", "Remoto · Brasil"], ats: "Greenhouse", pay: null },
  { logo: "In", title: "Desenvolvedor(a) Front-end Pleno", company: "Inter", remote: false, where: ["Belo Horizonte · Hybrid", "Belo Horizonte · Híbrido"], ats: "Greenhouse", pay: { cur: "BRL", min: 9000, max: 12000 }, saved: true },
  { logo: "C", title: "Data Engineer", company: "CI&T", remote: true, where: ["Remote · Brazil", "Remoto · Brasil"], ats: "Lever", pay: { cur: "BRL", min: 14000, max: 18000 } },
  { logo: "T", title: "Staff Engineer, Messaging", company: "Twilio", remote: true, where: ["Remote · Americas", "Remoto · Américas"], ats: "Greenhouse", pay: { cur: "USD", min: 12400, max: 15800 } },
  { logo: "S", title: "Mobile Engineer (iOS)", company: "Swile", remote: false, where: ["São Paulo · On-site", "São Paulo · Presencial"], ats: "Lever", pay: null, closed: true },
];

export default async function Home() {
  const lang = await getLang();
  const t = dicts[lang];
  const companies = await getCompanies();
  const money = (p: NonNullable<Pay>) =>
    new Intl.NumberFormat(locales[lang], { style: "currency", currency: p.cur, maximumFractionDigits: 0 }).formatRange(p.min, p.max);
  let openOrder = 0;

  return (
    <main>
      <section className="hero">
        <div className="wrap">
          <h1>{t.hero.h1} <code className="true">true</code>.</h1>
          <p className="sub">{t.hero.sub}</p>
          <SearchForm t={t.hero} />
          <p className="prov"><span className="pulse" aria-hidden="true" />{t.hero.prov}</p>
        </div>

        <div className="stage">
          <div className="jobs">
            {sampleJobs.map((j) => (
              <article key={j.title} className={`job${j.closed ? " closed" : ""}`}>
                <div className="logo" aria-hidden="true">{j.logo}</div>
                <div>
                  <h3>{j.title}</h3>
                  <div className="meta">
                    <span>{j.company}</span>
                    <span><Icon name={j.remote ? "globe" : "pin"} />{j.where[lang === "pt" ? 1 : 0]}</span>
                    {j.closed
                      ? <span className="status"><Icon name="x" /><b>{t.job.closed}</b></span>
                      : <OpenStatus ats={j.ats} order={openOrder++} t={t.job} />}
                  </div>
                </div>
                <div className="pay num">
                  {j.pay ? money(j.pay) : "—"}
                  <small>{j.pay ? t.job.perMonth : t.job.noPay}</small>
                </div>
                <SaveButton saved={j.saved} disabled={j.closed} t={t.job} />
              </article>
            ))}
          </div>
          <p className="note">{t.job.note}</p>
        </div>
      </section>

      <section className="band inverse center">
        <div className="wrap">
          <h2>{t.ads.h}</h2>
          <p className="lead">{t.ads.lead}</p>
          <dl className="ledger num">
            <div><dt>{t.ads.l1}</dt><dd>0<small>{t.ads.l1s}</small></dd></div>
            <div><dt>{t.ads.l2}</dt><dd>ATS<small>{t.ads.l2s}</small></dd></div>
            <div><dt>{t.ads.l3}</dt><dd><code className="false">false</code><small>{t.ads.l3s}</small></dd></div>
          </dl>
        </div>
      </section>

      <section className="band alt">
        <div className="tiles">
          <div className="tile">
            <h2>{t.tiles.t1}</h2>
            <p>{t.tiles.t1p}</p>
            <div className="flow">
              <div className="step"><b>Airbnb</b> {t.tiles.board}<span>{t.tiles.api}</span></div>
              <div className="arrow" aria-hidden="true"><Icon name="down" /></div>
              <div className="step"><b>truthy</b> <span>{t.tiles.checked}</span></div>
              <div className="arrow" aria-hidden="true"><Icon name="down" /></div>
              <div className="step"><b>{t.tiles.you}</b> <span>{t.tiles.apply}</span></div>
            </div>
          </div>
          <div className="tile">
            <h2>{t.tiles.t2}</h2>
            <p>{t.tiles.t2p}</p>
            <div className="mini">
              <article className="job"><div><h3>Platform Engineer</h3><div className="meta"><span>Smartsheet</span><span className="status"><Icon name="check" /><b>{t.tiles.open}</b></span></div></div></article>
              <article className="job closed"><div><h3>Mobile Engineer (iOS)</h3><div className="meta"><span>Swile</span><span className="status"><Icon name="x" /><b>{t.tiles.closed}</b></span></div></div></article>
            </div>
          </div>
        </div>
      </section>

      <section className="band center">
        <div className="wrap">
          <h2>{t.co.h}</h2>
          <p className="lead">{t.co.lead}</p>
          <div className="companies">
            {companies.map((c) => (
              <Link key={c.slug} className="company" href={`/companies?q=${encodeURIComponent(c.name)}`}>
                {c.logo
                  ? <img className="logo" src={c.logo} alt="" width={30} height={30} />
                  : <span className="logo" aria-hidden="true">{c.name[0]}</span>}
                {c.name} <small>{c.ats}</small>
              </Link>
            ))}
          </div>
          <p style={{ marginTop: 36 }}>
            <Link className="more" href="/companies">{t.co.all}<Icon name="chev" /></Link>
          </p>
        </div>
      </section>
    </main>
  );
}
