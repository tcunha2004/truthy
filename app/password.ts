import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, keylen: number, opts: object) => Promise<Buffer>;

const N = 16384;
const R = 8;
const P = 1;
const KEYLEN = 64;

const derive = (password: string, salt: Buffer, n = N, r = R, p = P) =>
  scryptAsync(password, salt, KEYLEN, { N: n, r, p });

// Formato: scrypt$N$r$p$salt$hash (salt e hash em base64url). Os parâmetros vão junto para poder mudar sem quebrar contas antigas.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64url")}$${key.toString("base64url")}`;
}

// Hash falso para quando não há hash real: o tempo de resposta não revela que a conta não existe (ou é do Google).
const DUMMY = { salt: Buffer.alloc(16), key: Buffer.alloc(KEYLEN) };

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  try {
    const parts = stored?.split("$");
    if (!parts || parts.length !== 6 || parts[0] !== "scrypt") {
      await derive(password, DUMMY.salt);
      return false;
    }
    const [, n, r, p, salt, hash] = parts;
    const expected = Buffer.from(hash, "base64url");
    const actual = await derive(password, Buffer.from(salt, "base64url"), Number(n), Number(r), Number(p));
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
