const CODES = ["credentials", "exists", "rate", "invalid", "google_password", "google"] as const;

export type AuthError = (typeof CODES)[number];

// O erro vem da query string (?error=...): qualquer valor fora da lista é ignorado.
export const parseAuthError = (v: string | undefined): AuthError | undefined => CODES.find((c) => c === v);
