import type { RedisClientType } from "redis";

export type RateStore = Pick<RedisClientType, "get" | "del" | "multi">;
export type Limit = { key: string; max: number; windowSec: number };

export const limits = {
  loginEmail: (email: string): Limit => ({ key: `rl:login:email:${email.slice(0, 254)}`, max: 5, windowSec: 15 * 60 }),
  loginIp: (ip: string): Limit => ({ key: `rl:login:ip:${ip}`, max: 20, windowSec: 15 * 60 }),
  signupIp: (ip: string): Limit => ({ key: `rl:signup:ip:${ip}`, max: 10, windowSec: 60 * 60 }),
};

export async function blocked(r: RateStore, limit: Limit): Promise<boolean> {
  return Number(await r.get(limit.key)) >= limit.max;
}

// A janela começa no primeiro hit e não renova (EXPIRE ... NX).
export async function hit(r: RateStore, limit: Limit): Promise<void> {
  await r.multi().incr(limit.key).expire(limit.key, limit.windowSec, "NX").exec();
}

export async function clear(r: RateStore, key: string): Promise<void> {
  await r.del(key);
}

// ponytail: x-forwarded-for só é confiável atrás de um proxy que o defina; sem ele, todos caem no balde "unknown"
export function clientIp(h: Pick<Headers, "get">): string {
  return h.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
}
