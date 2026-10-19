import { dicts, getLang } from "../i18n";

const CONTACT = "tcunhalinkedin@gmail.com";

export async function generateMetadata() {
  return { title: `${dicts[await getLang()].privacy.title} · truthy` };
}

export default async function PrivacyPage() {
  const t = dicts[await getLang()].privacy;
  return (
    <main className="legal wrap">
      <h1>{t.h}</h1>
      <p>{t.updated}</p>
      {t.sections.map((s) => (
        <section key={s.h}>
          <h2>{s.h}</h2>
          <p>{s.p}</p>
        </section>
      ))}
      <p>{t.contact} <a href={`mailto:${CONTACT}`}>{CONTACT}</a></p>
    </main>
  );
}
