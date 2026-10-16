import type { RedisClientType } from "redis";

export type RateStore = Pick<RedisClientType, "del" | "decr" | "multi">;
export type Limit = { key: string; max: number; windowSec: number };

export const limits = {
  loginEmail: (email: string): Limit => ({ key: `rl:login:email:${email.slice(0, 254)}`, max: 5, windowSec: 15 * 60 }),
  loginIp: (ip: string): Limit => ({ key: `rl:login:ip:${ip}`, max: 20, windowSec: 15 * 60 }),
  signupIp: (ip: string): Limit => ({ key: `rl:signup:ip:${ip}`, max: 10, windowSec: 60 * 60 }),
};

// Reserva uma tentativa ANTES de autenticar: o INCR é atômico, então requisições em paralelo não passam do máximo
// (checar primeiro e contar depois deixaria todas passarem). A janela começa na primeira tentativa e não renova (EXPIRE ... NX).
export async function take(r: RateStore, limit: Limit): Promise<boolean> {
  const [count] = await r.multi().incr(limit.key).expire(limit.key, limit.windowSec, "NX").exec();
  return Number(count) <= limit.max;
}

// Devolve uma tentativa reservada (login com sucesso não gasta o limite do IP).
export async function refund(r: RateStore, key: string): Promise<void> {
  await r.decr(key);
}

export async function clear(r: RateStore, key: string): Promise<void> {
  await r.del(key);
}

// ponytail: o Next só preenche x-forwarded-for com o IP do socket quando o cliente não manda o cabeçalho; sem um proxy
// que o sobrescreva, quem manda um valor próprio escolhe o próprio balde e escapa dos limites por IP.
// Atrás de proxy que acrescenta o IP ao fim da lista, o confiável é o último valor, não o primeiro: rever no deploy.
export function clientIp(h: Pick<Headers, "get">): string {
  return h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
