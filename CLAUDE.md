# truthy (frontend)

Next.js (React) app for truthy: job search for tech that pulls listings straight from company ATSs. "No sponsored posts, just jobs that return true."

## Before any UI work, read these

The design system is already decided and approved. Do not invent a new look.

1. `PRODUCT.md`: who the users are, v1 scope, positioning, what must never be invented.
2. `DESIGN.md`: the design system (tokens, type, layout, components, states, motion, named rules). **This is the source of truth for every visual decision.**
3. `.impeccable/design.json`: the same tokens as data, plus ready HTML/CSS snippets for the main components (buttons, chip, search bar, field, job list, nav, company pill, tile).
4. `.impeccable/preview/system.html`: the approved reference page (landing + system sheet, light and dark). When in doubt about how something should look, match this file.

If something you need is not covered by DESIGN.md, extend it in the same spirit and say so. Do not silently add new colors, fonts, shadows or radii.

## Non-negotiables

- **Reference is apple.com.** Wide quiet bands, big tight headlines, one accent, pill controls, rounded tiles.
- **Tokens as CSS custom properties.** Port the `:root` (light) and `[data-theme="dark"]` variables from DESIGN.md into the global stylesheet. Components only read the semantic variables (`--bg`, `--surface`, `--ink`, `--accent`, ...) and never branch on the theme.
- **Themes:** light is the default; dark is the alternate. A sun/moon button in the nav switches them by setting `data-theme` on `<html>` and saving the choice to `localStorage` under `theme`. Set the attribute with an inline script in `<head>` before paint, so the page doesn't flash the wrong theme, and use `suppressHydrationWarning` on `<html>`.
- **One green.** The accent is used only for actions and "true" (open, saved). Never for decoration, and never to make a listing look featured.
- **Monospace only for the literal `true` / `false`.** No terminal look anywhere.
- **Fonts:** SF Pro on Apple devices, Inter (variable, via `next/font/google`) as the fallback. Mono: SF Mono, falling back to JetBrains Mono.
- **Icons:** outline SVGs at 1em, stroke 1.6, `currentColor`. No emoji or unicode glyphs as icons.
- **Bilingual EN / PT-BR.** No hardcoded UI strings; every string exists in both languages. Test layouts with PT, which runs about 20–30% longer.
- **Accessibility:** WCAG AA contrast, visible `:focus-visible` ring, `aria-pressed` on toggles (chips, save, language), and `prefers-reduced-motion` turns off all animation.

## Data rules (from PRODUCT.md and the worker)

- **Provenance is first-class.** Every listing shows its source ATS. Closed jobs show where they were removed from and when. Lists show when the sources were last checked.
- **Missing data shows as missing.** Null salary renders "Salary not listed" / "Salário não informado". Null `is_remote`, `seniority` or `countries` means "not informed", not "no". Never guess.
- **Job states:** open, checking, closed (title struck through, red), saved. Follow the Job Row spec in DESIGN.md.
- **`jobs.description` is raw HTML from the ATS.** Always sanitize it before rendering.
- **Never invent claims:** no fake job counts, user numbers, logos, testimonials or "featured" badges. Sample data must be labeled as sample.

## Design workflow

For design tasks (new screens, refinements, reviews), use the `/impeccable` skill. It already loads PRODUCT.md and DESIGN.md as context.
