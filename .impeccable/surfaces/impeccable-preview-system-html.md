---
version: 1
slug: "impeccable-preview-system-html"
primary_target: ".impeccable/preview/system.html"
related_targets: []
---

# Landing page (truthy)

Scope: landing page, the first surface and proof of the design system. Visitor mode: Persuade.
Audience: tech professionals in Brazil looking for national and international jobs. Action: run a job search (working search in the first viewport).
Proof: real companies from the seed, listings with provenance (source ATS, last check), closed state shown.
Constraints: bilingual EN / PT-BR; light theme default, dark theme via toggle. Sample roles and salaries are illustrative and labeled.

## Direction contract

THESIS: Apple.com's product-page craft, where the product shot is a verified job listing. Refuses the job-board template (logo cards, blue corporate, sponsored slots).
OWN-WORLD: white / #f5f5f7 alternating bands with full-bleed black band; ink #1d1d1f; one accent, truthy green #08803a (dark: #30d158 on black); SF Pro / Inter, tight display tracking; pill buttons; 18–28px radius tiles; mono reserved for `true` / `false`.
STORY: visitor reads "Jobs that return true.", understands every listing comes from the company's own ATS, searches.
FIRST VIEWPORT: translucent 48px nav (wordmark, Jobs/Companies/Saved, EN/PT, theme toggle, Sign in); centered 88px headline with mono green `true`; 24px sub; 760px pill search (role, location, Search jobs) with quick filter chips; provenance line with pulse; listing stage on #f5f5f7 starts below.
FORM: user-pinned reference apple.com (overrides roll); seed key fcd37df4; variants B (light) and C (dark) chosen by user.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
