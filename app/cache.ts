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
