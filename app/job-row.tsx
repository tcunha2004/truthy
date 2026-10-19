import { Suspense, type ReactNode } from "react";
import { SaveJob } from "./client";
import type { Company } from "./db";
import type { Dict } from "./i18n";
import { Icon } from "./icons";
import type { JobVersion } from "./job-data";
import { payText } from "./job-query";

// Peças da Job Row usadas pela /jobs e pela /saved.

// "Remoto · Brasil". Não repete "Remoto" quando o local já diz isso ("Remote, Brasil").
export function where(v: JobVersion, t: Dict["jobs"]) {
  const place = v.location ?? t.noLocation;
  return v.isRemote && !/remot/i.test(place) ? `${t.remoteAt} · ${place}` : place;
}

// Status enquanto a lista carrega (fallback do Stream da /jobs, /companies e /saved).
export function Checking({ text }: { text: string }) {
  return (
    <p className="prov" role="status">
      <span className="pulse" aria-hidden="true" />
      <span>{text}</span>
    </p>
  );
}

// Suspense que só faz streaming quando os dados demoram. Depois que um fallback aparece, o React segura a troca
// pelo conteúdo por 300 ms (throttle interno), mesmo com os dados chegando 10 ms depois: a lista piscava
// "Carregando" e saía em ~330 ms. Esperando um pouco antes, dado rápido (banco, vetor em cache) sai junto com
// o topo; só o lento (OpenAI sem cache) vira fallback + streaming.
// ponytail: orçamento fixo de 200 ms; remedir se as consultas passarem disso.
export async function Stream<T>({ data, fallback, children }: { data: Promise<T>; fallback?: ReactNode; children: (value: T) => ReactNode }) {
  const ready = await Promise.race([data, new Promise<undefined>((r) => setTimeout(r, 200))]);
  return ready !== undefined ? children(ready) : <Suspense fallback={fallback}>{data.then(children)}</Suspense>;
}

export function Logo({ co, name }: { co: Company | undefined; name: string }) {
  return co?.logo
    ? <img className="logo" src={co.logo} alt="" width={44} height={44} />
    : <div className="logo" aria-hidden="true">{name[0]}</div>;
}

// Linha de um local só. closed = texto do estado fechada ("Closed · removed from Lever 2 days ago");
// fechada não tem link (o ATS já tirou a vaga) e o título sai riscado, como manda o DESIGN.md.
export function JobRow({ v, title, company, co, saved, closed, locale, t, tj }: {
  v: JobVersion; title: string; company: string; co: Company | undefined; saved: boolean; closed?: string;
  locale: string; t: Dict["jobs"]; tj: Dict["job"];
}) {
  const pay = payText(v, locale);
  return (
    <article className={`job${closed ? " closed" : ""}`}>
      <Logo co={co} name={company} />
      <div>
        <h3>
          {closed ? title : (
            <a href={v.url} target="_blank" rel="noopener noreferrer">
              {title}<span className="sr"> {t.newTab}</span>
            </a>
          )}
        </h3>
        <div className="meta">
          <span>{company}</span>
          <span><Icon name={v.isRemote ? "globe" : "pin"} />{where(v, t)}</span>
          {closed
            ? <span className="status"><Icon name="x" /><b>{closed}</b></span>
            : <span className="status"><Icon name="check" className="ck" /><b>{tj.openVia} {co?.ats ?? ""}</b></span>}
        </div>
      </div>
      <div className="pay num">
        {pay ?? "—"}
        <small>{pay ? tj.perMonth : tj.noPay}</small>
      </div>
      <SaveJob jobId={v.id} saved={saved} closed={!!closed} t={tj} />
    </article>
  );
}
