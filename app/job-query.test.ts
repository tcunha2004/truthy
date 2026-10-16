import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_PAGE, MAX_QUERY, NO_FILTERS, activeFilters, groupPay, jobsHref, pageCount, parseJobParams, payText, type JobFilters } from "./job-query.ts";

const slugs = ["airbnb", "ciandt", "Flex"];

test("parâmetros válidos passam como estão", () => {
  const f = parseJobParams({ q: " react node ", remote: "1", country: "BR", kind: "nacional", company: "ciandt", page: "3" }, slugs);
  assert.deepEqual(f, { q: "react node", remote: true, country: "BR", kind: "nacional", company: "ciandt", page: 3 });
});

test("sem parâmetros vira NO_FILTERS", () => {
  assert.deepEqual(parseJobParams({}, slugs), NO_FILTERS);
});

test("q: só espaços é vazio, longo demais é cortado", () => {
  assert.equal(parseJobParams({ q: "   " }, slugs).q, "");
  assert.equal(parseJobParams({ q: "a".repeat(MAX_QUERY + 100) }, slugs).q.length, MAX_QUERY);
});

test("country só aceita duas letras maiúsculas", () => {
  for (const country of ["br", "BRA", "B", "", "12"]) assert.equal(parseJobParams({ country }, slugs).country, null, country);
});

test("parâmetro repetido usa o primeiro valor", () => {
  assert.equal(parseJobParams({ country: ["BR", "US"] }, slugs).country, "BR");
  assert.equal(parseJobParams({ q: ["react", "vue"] }, slugs).q, "react");
});

test("kind fora do enum e empresa desconhecida são ignorados", () => {
  const f = parseJobParams({ kind: "gringa", company: "google" }, slugs);
  assert.equal(f.kind, null);
  assert.equal(f.company, null);
  assert.equal(parseJobParams({ company: "Flex" }, slugs).company, "Flex");
});

test("remote só liga com 1", () => {
  assert.equal(parseJobParams({ remote: "true" }, slugs).remote, false);
  assert.equal(parseJobParams({ remote: "1" }, slugs).remote, true);
});

test("page inválida vira 1 e page enorme é limitada", () => {
  for (const page of ["0", "-1", "abc", "2.5", ""]) assert.equal(parseJobParams({ page }, slugs).page, 1, page);
  assert.equal(parseJobParams({ page: "99999999999999" }, slugs).page, MAX_PAGE);
});

test("jobsHref sem filtros é /jobs e omite page 1", () => {
  assert.equal(jobsHref(NO_FILTERS), "/jobs");
  assert.equal(jobsHref({ ...NO_FILTERS, q: "react node" }), "/jobs?q=react+node");
});

test("jobsHref preserva busca e filtros ao trocar de página", () => {
  const f: JobFilters = { q: "go", remote: true, country: "BR", kind: "internacional", company: "airbnb", page: 1 };
  assert.equal(jobsHref({ ...f, page: 2 }), "/jobs?q=go&remote=1&country=BR&kind=internacional&company=airbnb&page=2");
});

test("activeFilters não conta q nem page", () => {
  assert.equal(activeFilters({ ...NO_FILTERS, q: "x", page: 4 }), 0);
  assert.equal(activeFilters({ ...NO_FILTERS, remote: true, country: "BR", kind: "nacional", company: "airbnb" }), 4);
});

test("pageCount nunca é zero", () => {
  assert.equal(pageCount(0), 1);
  assert.equal(pageCount(20), 1);
  assert.equal(pageCount(21), 2);
});

const eur = (n: number) => new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

test("payText: sem moeda ou sem valor é ausente", () => {
  assert.equal(payText({ salaryMin: null, salaryMax: null, salaryCurrency: "EUR" }, "en"), null);
  assert.equal(payText({ salaryMin: 4000, salaryMax: 5000, salaryCurrency: null }, "en"), null);
});

test("payText: moeda malformada é ausente em vez de quebrar a página", () => {
  assert.equal(payText({ salaryMin: 4000, salaryMax: 5000, salaryCurrency: "US" }, "en"), null);
});

test("payText: um valor só, valores iguais, faixa invertida e centavos", () => {
  assert.equal(payText({ salaryMin: null, salaryMax: 5000, salaryCurrency: "EUR" }, "en"), eur(5000));
  assert.equal(payText({ salaryMin: 5000, salaryMax: 5000, salaryCurrency: "EUR" }, "en"), eur(5000));
  const range = new Intl.NumberFormat("en", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).formatRange(4000, 5000);
  assert.equal(payText({ salaryMin: 5000, salaryMax: 4000, salaryCurrency: "EUR" }, "en"), range);
  assert.ok(!payText({ salaryMin: 10000, salaryMax: 15833.333, salaryCurrency: "USD" }, "en")!.includes("."));
});

test("groupPay: igual em todo local, ausente em todo local, ou varia", () => {
  const a = { salaryMin: 4000, salaryMax: 5000, salaryCurrency: "EUR" };
  const none = { salaryMin: null, salaryMax: null, salaryCurrency: null };
  assert.equal(groupPay([a, a], "en"), payText(a, "en"));
  assert.equal(groupPay([none, none], "en"), null);
  assert.equal(groupPay([a, none], "en"), "varies");
});
