import { getRedis } from "./redis.ts";

// Memoiza uma função async por chave, com no máximo `max` entradas (a mais antiga sai primeiro).
// null não é guardado: uma falha passageira não fica presa no cache.
// ponytail: memória do processo; cada instância do servidor tem o seu. Cache compartilhado (Redis/Postgres) se escalar para várias.
export function cached<T>(fn: (key: string) => Promise<T | null>, max: number) {
  const store = new Map<string, T>();
  return async (key: string): Promise<T | null> => {
    const hit = store.get(key);
    if (hit !== undefined) return hit;
    const value = await fn(key);
    if (value !== null) {
      if (store.size >= max) store.delete(store.keys().next().value as string);
      store.set(key, value);
    }
    return value;
  };
}

// Igual ao cached, mas no Redis: sobrevive a restart e vale para todas as instâncias. Só para valores string.
// Redis fora do ar não derruba nada: cai direto na função (é cache, não rate limit).
export function stored(prefix: string, ttlSeconds: number, fn: (key: string) => Promise<string | null>) {
  return async (key: string): Promise<string | null> => {
    const redis = await getRedis().catch(() => null);
    const hit = await redis?.get(prefix + key).catch(() => null);
    if (hit) return hit;
    const value = await fn(key);
    if (value !== null) await redis?.set(prefix + key, value, { EX: ttlSeconds }).catch(() => {});
    return value;
  };
}
