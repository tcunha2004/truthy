import { createClient, type RedisClientType } from "redis";

// Um cliente por processo; o global evita abrir outro a cada hot reload.
const g = globalThis as unknown as { redis?: RedisClientType };

// Se a conexão falhar a promise rejeita e a próxima chamada tenta de novo: nunca devolve cliente desconectado.
export async function getRedis(): Promise<RedisClientType> {
  // reconnectStrategy: false → connect() rejeita em vez de tentar para sempre; quem chama falha fechado e o próximo pedido reconecta.
  const client = (g.redis ??= createClient({
    url: process.env.REDIS_URL,
    socket: { reconnectStrategy: false, connectTimeout: 2000 },
  }) as RedisClientType);
  // sem este listener, um erro de conexão derrubaria o processo
  if (client.listenerCount("error") === 0) client.on("error", (err) => console.error("redis:", err.message));
  if (!client.isOpen) {
    try {
      await client.connect();
    } catch (err) {
      await client.disconnect().catch(() => {});
      g.redis = undefined;
      throw err;
    }
  }
  return client;
}
