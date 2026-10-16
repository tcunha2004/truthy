import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAuthError } from "./auth-error.ts";

test("códigos conhecidos passam", () => {
  for (const code of ["credentials", "exists", "rate", "invalid", "google_password", "google"]) {
    assert.equal(parseAuthError(code), code);
  }
});

test("valor desconhecido, malicioso ou ausente vira undefined", () => {
  assert.equal(parseAuthError("<script>"), undefined);
  assert.equal(parseAuthError("foo"), undefined);
  assert.equal(parseAuthError("toString"), undefined); // não pode herdar do Object.prototype
  assert.equal(parseAuthError(""), undefined);
  assert.equal(parseAuthError(undefined), undefined);
});
