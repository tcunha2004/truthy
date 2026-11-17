// Liga matchAll às dependências reais: Redis (cache e limite), Postgres (vagas) e Claude Haiku 4.5 no Bedrock.
import { AnthropicBedrock } from "@anthropic-ai/bedrock-sdk";
import { db } from "./db";
import type { Lang } from "./i18n";
import { MATCH_PROMPT, MATCH_SCHEMA, MATCH_TOP, matchAll, matchInput, matchPrefix, normalizeMatch, type Match, type MatchJob, type MatchState } from "./match";
import type { Profile } from "./profile-options";
import { limits, take } from "./rate-limit";
import { getRedis } from "./redis";

const MODEL = "global.anthropic.claude-haiku-4-5-20251001-v1:0";
const TTL = 7 * 86400;

export const matchEnabled = !!process.env.AWS_REGION && !!process.env.AWS_BEARER_TOKEN_BEDROCK;

// Criado no primeiro uso, não no import: um build sem as variáveis não quebra.
let client: AnthropicBedrock | undefined;

const analyze = (lang: Lang, profile: Profile) => async (job: MatchJob): Promise<Match> => {
  try {
    client ??= new AnthropicBedrock();
    const res = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 512,
        system: MATCH_PROMPT,
        messages: [{ role: "user", content: matchInput(lang, profile, job) }],
        output_config: { format: { type: "json_schema", schema: MATCH_SCHEMA } },
      },
      { timeout: 8000, maxRetries: 0 },
    );
    if (res.stop_reason === "refusal" || res.stop_reason === "max_tokens") throw new Error(`stop_reason ${res.stop_reason}`);
    const text = res.content.find((b) => b.type === "text");
    const match = text && normalizeMatch(JSON.parse(text.text));
    if (!match) throw new Error("resposta fora do schema");
    return match;
  } catch (err) {
    console.error("match:", err);
    throw err;
  }
};

async function jobs(ids: string[]): Promise<MatchJob[]> {
  const { rows } = await db.query(
    `SELECT j.id::text AS id, j.title, c.name AS company, j.description, j.seniority, j.stack,
            j.location, j.is_remote AS "isRemote", j.countries
     FROM jobs j JOIN companies c ON c.id = j.company_id
     WHERE j.id = ANY($1::bigint[])`,
    [ids],
  );
  return rows;
}

// Síncrona: começa o trabalho e devolve uma promise por vaga (as 10 primeiras), nenhuma rejeita.
export function loadMatches(userId: string, lang: Lang, profile: Profile, ids: string[]): Map<string, Promise<MatchState>> {
  const r = getRedis();
  return matchAll(ids.slice(0, MATCH_TOP), matchPrefix(lang, profile), {
    mget: async (keys) => (await r).mGet(keys),
    take: async () => {
      const redis = await r;
      const l = limits.matchUser(userId);
      if (await take(redis, l)) return { ok: true };
      const ttl = await redis.ttl(l.key);
      return { ok: false, minutes: Math.max(1, Math.ceil(ttl / 60)) };
    },
    jobs,
    analyze: analyze(lang, profile),
    save: async (k, v) => {
      await (await r).set(k, v, { EX: TTL });
    },
  });
}
