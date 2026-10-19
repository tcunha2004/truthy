import { dicts, getLang } from "../i18n";
import { Checking } from "../job-row";

// Aparece no clique, enquanto o servidor monta a /jobs. Sem título: aqui ainda não se sabe se é Para você ou busca.
export default async function Loading() {
  const t = dicts[await getLang()].jobs;
  return (
    <main className="co-page">
      <section className="co-hero">
        <div className="wrap">
          <Checking text={t.loading} />
        </div>
      </section>
      <div className="co-stage" />
    </main>
  );
}
