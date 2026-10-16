---
name: truthy
description: No sponsored posts, just jobs that return true.
colors:
  bg: "#ffffff"
  bg-alt: "#f5f5f7"
  bg-inverse: "#000000"
  surface: "#ffffff"
  ink: "#1d1d1f"
  ink-2: "#6e6e73"
  ink-inverse: "#f5f5f7"
  ink-inverse-2: "#a1a1a6"
  line: "#d2d2d7"
  accent: "#08803a"
  accent-hover: "#076f32"
  on-accent: "#ffffff"
  true: "#127a2e"
  false: "#b42318"
  bg-dark: "#000000"
  bg-alt-dark: "#161617"
  bg-inverse-dark: "#f5f5f7"
  surface-dark: "#1d1d1f"
  ink-dark: "#f5f5f7"
  ink-2-dark: "#a1a1a6"
  line-dark: "#424245"
  accent-dark: "#30d158"
  accent-hover-dark: "#3ddc64"
  on-accent-dark: "#00230b"
  true-dark: "#30d158"
  false-dark: "#ff6961"
typography:
  display:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "clamp(44px, 8vw, 88px)"
    fontWeight: 650
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "clamp(36px, 5.6vw, 64px)"
    fontWeight: 650
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  title:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "clamp(30px, 3.4vw, 44px)"
    fontWeight: 650
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  stat:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "40px"
    fontWeight: 650
    letterSpacing: "-0.04em"
  lead:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "clamp(19px, 2.2vw, 24px)"
    fontWeight: 450
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47
    letterSpacing: "-0.012em"
    fontFeature: "\"cv11\", \"ss01\""
  item-title:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  meta:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "14px"
    fontWeight: 400
  label:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "13px"
    fontWeight: 400
  caption:
    fontFamily: "\"SF Pro Display\", \"SF Pro Text\", -apple-system, BlinkMacSystemFont, Inter, \"Segoe UI\", sans-serif"
    fontSize: "12px"
    fontWeight: 500
  mono:
    fontFamily: "\"SF Mono\", ui-monospace, \"JetBrains Mono\", Menlo, monospace"
    fontWeight: 500
    letterSpacing: "-0.02em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "18px"
  xl: "28px"
  pill: "980px"
spacing:
  gutter: "16px"
  row-y: "18px"
  row-x: "20px"
  tile: "48px"
  tile-mobile: "32px 24px"
  stage: "56px"
  band: "120px"
  band-mobile: "80px"
  content-width: "980px"
  list-width: "860px"
  search-width: "760px"
  tiles-width: "1240px"
  nav-height: "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-primary-sm:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "30px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "44px"
  button-quiet:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "44px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "34px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.bg}"
  search-bar:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "6px"
    width: "760px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  job-list:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    width: "860px"
  job-row:
    padding: "18px 20px"
  company-logo:
    backgroundColor: "{colors.bg-alt}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "44px"
  tile:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "48px"
  company-pill:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 18px 8px 8px"
  nav:
    height: "48px"
---

# Design System: truthy

## Overview

**Creative North Star: "The Product Shot Is a Verified Listing"**

truthy borrows apple.com's product-page craft and points it at job search: wide quiet bands, very large tightly tracked headlines, one restrained accent, pill-shaped controls, and generously rounded tiles. Where Apple puts a device in the hero, truthy puts the thing it sells: a list of real, verified job rows on a soft grey stage. Everything else steps back so that listing reads as the product.

The tone is calm and confident with one wink. The name is a programming joke (`return true`), so a single monospace `true` in accent green sits inside the headline, and the same `true` / `false` vocabulary marks whether a job is open or closed. That is the only place monospace appears; the interface never dresses up as a terminal. Provenance (which ATS, when it was checked) is shown as first-class information, in small grey meta text next to every listing, never hidden in a tooltip.

Light is the primary theme (white and #f5f5f7 bands, near-black ink). Dark is a full alternate (black and #161617 bands, a brighter green), switched by a sun/moon button and remembered per browser. Both themes are driven by the same CSS custom property names, so components never branch on theme. Confirmed rejections: looking like LinkedIn or Indeed (logo-card grids, corporate blue, sponsored slots), a terminal costume (black screen, green mono everywhere), and a cold, humourless finish.

**Key Characteristics:**
- Alternating full-width bands: white, #f5f5f7, and one full-bleed inverse (black) band per page at most.
- Display type at 650 weight with tight negative tracking (-0.035em); body at 17px / 1.47.
- One accent: truthy green, used for the primary action, links, the open state, and saved state.
- Pills for every control (buttons, chips, search bar, company links); 18px and 28px radii for containers.
- Flat, soft depth: one ambient shadow token plus 1px hairlines, never hard edges.
- Monospace only for the literal `true` / `false`.
- Bilingual EN / PT-BR; layouts must survive PT strings that run ~20-30% longer.

## Colors

A near-monochrome Apple-grey palette with a single green voice and a red reserved for closed jobs and errors. All values are exposed as CSS custom properties on `:root` (light) and overridden under `[data-theme="dark"]`; the `-dark` keys in the frontmatter are the dark-theme values of the same variables, not separate tokens to reference directly.

### Primary
- **Truthy Green** (`accent`; dark `accent-dark`): the primary button fill, ghost button stroke and text, inline links (`--link` equals `--accent`), the saved bookmark fill, the search bar's focus ring, text caret and selection tint (22% mix). On light it is a deep green with white text; on dark it is the bright system green with very dark green text (`on-accent-dark`), never white.
- **Truthy Green, Pressed** (`accent-hover`; dark `accent-hover-dark`): hover fill for primary buttons. Light goes darker; dark goes lighter.

### Secondary
- **Open Green** (`true`; dark `true-dark`): the state color for "this returns true": open status text and check icon, the provenance pulse dot, the wordmark dot, and the mono `true` in the headline. Kept as its own token, separate from the accent, so state color and action color can move independently.
- **Closed Red** (`false`; dark `false-dark`): closed status text and x icon, the mono `false`, input error border and error message. Never used for decoration or promotion.

### Neutral
- **Page White / Black** (`bg`): default band and page background.
- **Apple Mist** (`bg-alt`; dark #161617): alternate bands, the listing stage, footer, company-logo placeholders, inner panels inside tiles (flow steps, mini lists), empty states.
- **Inverse Band** (`bg-inverse`, `ink-inverse`, `ink-inverse-2`): the single full-bleed contrast band (black on light theme, #f5f5f7 on dark theme) and the ledger cells inside it.
- **Surface** (`surface`; dark #1d1d1f): raised cards that sit on `bg-alt`: the job list, tiles, search bar, inputs, company pills.
- **Ink** (`ink`): headlines, body, nav links (at 0.82 opacity), selected chip fill.
- **Ink Secondary** (`ink-2`): leads, meta lines, provenance, salary sub-labels, placeholders, field labels, the closed job title.
- **Hairline** (`line`): input and chip borders, search-field dividers, swatch outlines. Row dividers use it at 70% mix; the nav border at 60%.

### Named Rules
**The One Green Rule.** Green means "action" or "true", nothing else. No green backgrounds on bands, no green headlines beyond the mono `true`, no green badges for promotion.

**The Same Names Rule.** Components read only the semantic variables (`--bg`, `--surface`, `--ink`, `--accent`, ...). Theme switching is a `data-theme` attribute on `<html>`; no component carries a `.dark` branch.

**The No Paid Highlight Rule.** No color, border, or badge may single a listing out as featured or sponsored. Saved (filled accent bookmark) is the only per-row emphasis, and it is the user's own.

## Typography

**Display Font:** SF Pro Display (with -apple-system, BlinkMacSystemFont, then Inter as the web fallback, Segoe UI, sans-serif)
**Body Font:** same stack; Inter is loaded from Google Fonts as a variable font (opsz 14-32, weight 400-700) for non-Apple devices
**Label/Mono Font:** SF Mono (with ui-monospace, JetBrains Mono 500, Menlo)

**Character:** One grotesque family doing everything, Apple-style, with hierarchy carried by size, weight and tracking instead of a second typeface. Intermediate weights (450 for leads, 650 for display) are intentional and need the variable font. Body applies `font-feature-settings: "cv11", "ss01"` (Inter alternates) and `-webkit-font-smoothing: antialiased`.

### Hierarchy
- **Display** (650, clamp 44-88px, 1.04, -0.035em, `text-wrap: balance`): the one hero headline per page.
- **Headline** (650, clamp 36-64px, 1.06, -0.035em, balanced): band headlines. 40px fixed is acceptable for in-page section headings that are not bands.
- **Title** (650, clamp 30-44px, 1.08, -0.035em): tile headlines.
- **Stat** (650, 40px, -0.04em): ledger figures, with a 15px / 450 `ink-2` small line under each.
- **Lead** (450, clamp 19-24px, 1.35-1.38, -0.02em, `ink-2`, max 34-40ch, balanced): the paragraph under a display or headline.
- **Body** (400, 17px, 1.47, -0.012em): all running text and input text. Tile copy steps up to 19px / 1.4, max 36ch.
- **Item Title** (600, 17px, 1.3, -0.02em): job titles in lists. Empty-state titles use 21px with -0.02em.
- **Meta** (400, 14px, `ink-2`): company, location, chip text (14px), ledger labels. Gap 4px row / 14px column between meta items.
- **Label** (13px): nav links, small buttons, provenance line, field labels, flow-step hints.
- **Caption** (12px; 500 for status, 400 elsewhere): job status, salary sub-label, footer, sample-data notes, language switch (12px).
- **Mono** (500, -0.02em; -0.05em inside the display headline): the literal `true` (color `true`) and `false` (color `false`) only.

All numbers (salaries, stats) use `font-variant-numeric: tabular-nums`.

### Named Rules
**The Literal Mono Rule.** Monospace is set only on the words `true` and `false`. Not on IDs, timestamps, ATS names, code-flavoured labels, or buttons.

**The Tight Display Rule.** Anything 30px and up is weight 650 with -0.035em tracking (stats -0.04em). Don't set large type at 400 or with default tracking.

**The Sentence Case Rule.** All UI text is sentence case. No uppercase labels, no letter-spaced eyebrows above headlines.

## Layout

The page is a vertical stack of full-width bands. Content sits in a centered column `width: min(980px, 100% - 32px)` (16px gutters on mobile). Wider and narrower measures are deliberate: the job list is 860px max, the search bar 760px max, the tile grid 1240px max (`100% - 24px`).

- **Bands:** 120px vertical padding (80px at ≤860px). Order alternates `bg` and `bg-alt`, with at most one `bg-inverse` band. Band content is usually centered text above a component.
- **Hero:** 88px top padding (56px on mobile), centered. Display → 18px → lead → 40px → search bar → 18px → filter chips (8px gap, wrap, centered) → 22px → provenance line. The listing stage starts 56px below, on `bg-alt`, with 56px top / 72px bottom padding, so the list appears to rest on a grey plinth.
- **Tiles:** two columns at 1.15fr / 1fr with a 12px gap; each tile is 520px min-height with 48px padding and its visual pushed to the bottom (`margin-top: auto`).
- **Ledger:** three equal columns separated by 1px gaps (the gap shows a 16% ink-inverse mix as the divider), 28px cell padding, 64px below the lead.
- **Job row grid:** `44px 1fr auto auto` (logo, title + meta, salary, save), 16px gap, 18px / 20px padding.
- **Recurring spacing:** 6, 8, 12, 16, 18, 20, 24, 28, 40, 48, 56, 72, 88, 120px. Small gaps (6-10px) inside controls; 12-18px between siblings; 40-64px between a lead and its component.

### Responsive (single breakpoint, 860px)
- Nav becomes two rows (88px): the wordmark left and EN/PT, theme toggle, Sign in (or Finish profile and the avatar) on the right with 8px gaps; below, Jobs / Companies / Saved as equal-width 32px pill tabs at 14px, the current one on an 8% ink wash. The first name and Sign out leave the bar; Sign out lives at the bottom of the profile page.
- Search bar stacks into one column, radius drops from pill to 18px, fields are divided by top hairlines, and the button goes full width with a 12px radius.
- Job row becomes `40px 1fr auto`, top-aligned: salary moves under the title on one line with its sub-label ("R$ 9.000–12.000 per month"), save stays top-right; logo shrinks to 40px; padding 16px, gap 6px / 12px. Lists on a stage keep a 16px gutter.
- Tiles, ledger and mini lists collapse to one column; tiles lose min-height and pad 32px / 24px.

### Motion
One easing for everything: `cubic-bezier(.16, 1, .3, 1)` (fast out, long settle). Hover and state transitions run 0.2s; theme change cross-fades background and color over 0.4s. Two authored moments: the provenance dot pulses (2.4s loop, an 8px fading ring), and on load each listing shows "Checking source…" then draws its check mark (0.6s stroke-dashoffset), staggered 260ms per row. `prefers-reduced-motion: reduce` removes all animation and transition.

## Elevation & Depth

Depth is soft and mostly tonal: raised surfaces are `surface` on a `bg-alt` stage, separated by a single diffuse ambient shadow plus 1px inset hairlines. Nothing has a hard or offset shadow, and nothing lifts on hover.

### Shadow Vocabulary
- **Ambient** (`box-shadow: 0 4px 24px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.05)`; dark `0 4px 24px rgba(0,0,0,.5)`): the job list and the search bar. The only shadow token.
- **Hairline Ring** (`box-shadow: inset 0 0 0 1px var(--line)`): search bar, company pills, swatches. Used instead of `border` so it doesn't affect layout; hover swaps the ring to `ink-2`.
- **Focus Ring** (`outline: 3px solid var(--focus)`, offset 2px; `--focus` is the accent at 40% light / 45% dark): every focusable element via `:focus-visible`. Inputs use `box-shadow: 0 0 0 4px var(--focus)` with an accent border; the search bar uses an inset 2px accent ring on `:focus-within`.

### Named Rules
**The Glass Nav Rule.** The only translucent surface is the sticky 48px nav: `bg` at 80% with `backdrop-filter: saturate(180%) blur(20px)` and a 60% hairline underneath. No other glass panels.

## Shapes

Soft, Apple-style geometry with two families: anything you press is a full pill (980px radius) or a circle; anything that contains is a rounded rectangle that gets rounder as it gets bigger. Inputs and inner panels 12px; lists, empty states, ledgers, mini lists 18px; tiles 28px. Logos are 12px squircles in rows and circles inside company pills. Icons are 24-unit outline SVGs at 1em, stroke 1.6 (2.4 for the small status check and link chevron), round caps and joins, `currentColor`.

**The Press Is Round Rule.** Buttons, chips, the search bar, company links, the save button and the theme toggle are pills or circles. Only the stacked mobile search button squares off to 12px.

## Components

### Buttons
Calm, solid pills; colour does the work, not shadow.
- **Shape:** full pill (980px).
- **Primary:** `accent` fill, `on-accent` text, 44px tall, 22px side padding, 17px / 500. Inside the search bar 52px tall with 26px padding.
- **Small:** 30px tall, 14px padding, 13px text (nav Sign in, empty-state action).
- **Hover / Active:** fill shifts to `accent-hover` over 0.2s; press scales to 0.98. No lift, no shadow.
- **Ghost:** transparent, accent text, 1px inset accent ring; hover adds an 8% accent wash. Secondary actions ("Save search").
- **Quiet:** 8% ink wash, ink text. Neutral actions ("Clear filters", "Remove filter").
- **Disabled:** 38% opacity, `not-allowed` cursor.
- **Text link with chevron:** accent text plus a 0.7em chevron, underline on hover. Used for outbound and "see all" actions ("Apply on Greenhouse", "Browse all companies").

### Chips
- **Style:** 34px pill, 1px `line` border, transparent, 14px ink text, 14px padding.
- **State:** toggle buttons with `aria-pressed`. Selected inverts to `ink` fill with `bg` text (white chip on dark theme, black chip on light). Hover darkens the border to `ink-2`. Filter only; chips are never used as status badges.

### Search Bar (signature)
- 760px max pill on `surface`, 6px inner padding, ambient shadow plus hairline ring. Grid `1.4fr 1fr auto`: role/skill field, location field (divided by a hairline), primary button.
- Each field is 52px tall with an `ink-2` 1em outline icon (search, pin) and a borderless 17px input.
- `:focus-within` swaps the hairline for a 2px inset accent ring. Stacks at ≤860px (see Layout).
- **Single-field variant** (`.search.one`, jobs page and landing): grid `1fr auto`, one free-text field ("Describe the job") and the primary button. Used once location became a filter instead of a field.

### Inputs / Fields
- **Style:** 44px tall, 12px radius, 1px `line` border, `surface` fill, 14px padding, 17px text. Label sits above in 13px `ink-2` with a 6px gap; max width 320px.
- **Focus:** border becomes `accent` plus a 4px `--focus` halo; no outline.
- **Error:** border `false`, message below in 12px `false`, upright (not italic).
- Caret color is the accent everywhere.

### Choice Chips (forms)
- Same look as filter chips (34px pill, 1px `line`, 14px), but built on native `<input type="radio">` / `<input type="checkbox">` inside a `<label class="chip pick">`, so arrows, space and form semantics come free. Selected (`:checked`) inverts to `ink` fill with `bg` text, exactly like `aria-pressed` chips.
- Focus ring goes on the label via `:has(input:focus-visible)`. Disabled is 38% opacity.
- Items the user typed in (stack) render as selected chips with a 22px circular remove button (x icon) and enter with a short scale-in.

### Filter Panel
- A native `<details>` under the search bar. The summary is a quiet 34px pill ("Filters · 2 active", chevron rotating from down to up), with an 8% ink wash on hover; it starts open when any filter is active.
- Open, it shows a `surface` panel, 18px radius, 1px inset `line` ring (no shadow; the search bar above keeps the only ambient shadow), 24px padding, 20px between groups: choice chips in fieldsets with 13px `ink-2` legends, then a two-column row of Fields with native `<select>`, then a small primary "Apply filters" and a quiet "Clear filters".
- Works without JavaScript: it lives inside the search `<form>`, which submits with GET.

### Choice Cards
- Single-choice options that need a subtitle (search status). `surface` fill, 18px radius, 18px / 20px padding, 1px inset `line` ring; hover darkens the ring to `ink-2`; selected is a 2px inset `ink` ring. Title 17px / 600, subtitle 14px `ink-2`.

### Segmented Choice
- The `.seg` pill (4px padding, inset hairline) with native radios inside; the checked segment fills with `ink`. Used for currency.

### Range Slider (dual)
- Two native range inputs stacked on one 4px track. Track is `line`, the selected span is `accent`. Thumbs are 28px `surface` circles with the ambient shadow and a hairline ring; focus adds the 4px `--focus` halo. Thumbs never cross; editable amount fields (field style, currency symbol in `ink-2`, tabular numbers) sit below and stay in sync.

### Combobox
- A field with a listbox below: `surface`, 12px radius, ambient shadow plus hairline ring, 6px padding; options 15px with 8px radius, hover/active on `bg-alt`. Arrow keys move, Enter picks, Esc closes.

### Progress Bar
- 3px bar pinned under the nav on `bg-alt`; the filled part is `accent` and grows with `transform: scaleX` from the left. Only used in onboarding, which hides the footer and the nav's Finish profile shortcut so the flow stays focused.

### Save Bar
- Fixed to the bottom, same translucent blur as the nav, hairline on top. Slides up only when there are unsaved changes, shows the state in 13px `ink-2` and a small primary button. Also the mobile home of the onboarding "Continue" button.

### Step Transition
- Onboarding steps slide 48px and fade: out to the left and in from the right when going forward, mirrored when going back (View Transitions API). Single-choice steps advance 300ms after a pointer pick; keyboard selection never advances on its own. All of it is off under `prefers-reduced-motion`.

### Job List and Job Row (signature)
The product shot. A `surface` card, 18px radius, ambient shadow, 860px max, rows divided by hairlines at 70%.
- **Row:** logo placeholder (44px, 12px radius, `bg-alt`, initial at 17px / 650), then the item title and a meta line (company, location with globe/pin icon, status), then salary (15px / 500, right aligned, tabular, with a 12px `ink-2` sub-label such as "per month"), then a 36px circular save button.
- **Hover:** 3% ink wash on the row, 0.2s.
- **Status, open:** 12px / 500 in `true`, check icon, text "Open · via <ATS>".
- **Status, checking:** `ink-2` text "Checking source…", check icon undrawn; on resolve the check strokes in and color turns `true`.
- **Status, closed:** title struck through (1.5px) in `ink-2`, logo at 45% opacity, status in `false` with an x icon, "Closed · removed from <ATS> <time ago>", save disabled.
- **Saved:** bookmark filled with `accent` (`aria-pressed="true"`). Unsaved is an `ink-2` outline that darkens with a 7% circular wash on hover. A save is one specific location (one ATS posting), never a whole group. The button flips as soon as it is pressed and flips back if the server refuses. A closed job can't be saved, but a closed job that is already saved keeps an enabled bookmark so it can be removed.
- **Missing data:** shown as missing. Salary renders an em dash with "Salary not listed"; never estimate or hide the slot.
- **Compact variant (mini list):** title + meta only, single column, inside an 18px `bg-alt` frame with 6px padding; rows are 12px-radius `surface` panels 6px apart (like the flow steps).
- **Grouped row (jobs page):** the same job posted in several places (same company and title) is one row. The row is a `<details>` summary showing "N locations" with a pin icon and a chevron in a fourth column; open, it lists each location in 14px rows (location with globe/pin, its salary or "Salary not listed", and an accent "Apply via <ATS>" link), indented to the title column and divided by hairlines; each location has its own save button at the end. The group summary has no save button. A single-location row links its title straight to the ATS in a new tab and has the save button in its fourth column.
- **Group salary:** shown once if every location pays the same; otherwise "Varies / by location".
- **Pagination:** below the list, 860px wide, 14px `ink-2`: "Previous" (chevron flipped) on the left, "Page n of m" centered, "Next" on the right. Plain links; missing ends leave an empty slot.

### Saved Page
- Same frame as the jobs page (hero with headline and lead, then the `bg-alt` stage). Two job lists, "Still open" first and "Closed" below, each under a 21px / 650 heading with its count in `ink-2`, 40px apart; each list goes from most recently saved to oldest. A section with no jobs is not shown.
- Closed rows use the Job Row closed state with the real time: "Closed · removed from <ATS> <time ago>", no link on the title.
- Removing a save keeps the row (outline bookmark) until the user leaves the page, so a misclick can be undone in place.
- Empty: the Empty State with "No saved jobs yet." and a quiet "Browse jobs" button.

### Provenance Line
13px `ink-2` text preceded by an 8px `true`-colored pulsing dot: "Sources checked <time> · Lever · Greenhouse". Place it near any list of jobs; it is the system's promise made visible.

### Tiles
28px radius, `surface` on a `bg-alt` band, 48px padding, 520px min-height, Title + 19px `ink-2` copy at top and a real UI fragment at the bottom (flow steps on 12px-radius `bg-alt` panels with 16px / 18px padding and down-arrow icons between, or a mini job list). Explanations are shown with product UI, not illustrations.

### Ledger
Inside the inverse band: a 3-column grid of facts on 18px-radius 1px-gap dividers. Each cell is a 14px `ink-inverse-2` label, a 40px Stat figure, and a 15px explanation. Use for durable, verifiable facts only (0 sponsored posts, ATS source, `false` on close); never invented user counts.

### Company Pill
Pill link on `surface` with a hairline ring, 30px circular logo initial, company name at 15px / 500 and the ATS name at 13px `ink-2`. Hover darkens the ring; no underline. Wrap in a centered flex row with 10px gaps.

### Empty State
18px-radius `bg-alt` panel (`surface` when it sits on a `bg-alt` stage), 40px padding, centered, max 520px with a 16px gutter: 21px ink title, `ink-2` explanation that names the likely cause, and one small quiet button to undo it (a second one sits 8px to its right).

### Navigation
- Sticky 48px glass bar (see The Glass Nav Rule). Content 13px, 28px gap between groups.
- Left: wordmark "truthy" in lowercase, 21px / 650 / -0.03em, followed by a 7px `true`-colored dot. Then Jobs / Companies / Saved links in ink at 0.82 opacity, full opacity on hover, no underline; the current section (`aria-current="page"`) is full opacity at 600.
- Right: EN / PT segmented toggle (12px, 6px radius; active is 600 weight on an 8% ink wash, `aria-pressed`), a 32px circular sun/moon theme button (`aria-label` names the target theme; choice stored in `localStorage` under `theme`, default light), and a small primary Sign in button.
- Mobile: see Responsive; nothing wraps and the bar never scrolls sideways.

### Footer
`bg-alt`, 12px `ink-2`, a hairline above, tagline left and "truthy · year" right.

## Do's and Don'ts

### Do:
- **Do** drive every color from the semantic CSS variables and switch themes with `data-theme` on `<html>`; default to light.
- **Do** show provenance on every listing: source ATS on open jobs, removal source and time on closed ones, last-checked time near lists.
- **Do** render missing data as missing ("Salary not listed" / "Salário não informado").
- **Do** keep closed jobs visible in context with the struck-through title and `false` red status rather than silently removing them from a list the user is looking at.
- **Do** use the 650 weight and -0.035em tracking for every heading 30px and up, with `text-wrap: balance`.
- **Do** write every string in both EN and PT-BR and test layouts with the PT version.
- **Do** use the single ease `cubic-bezier(.16, 1, .3, 1)` and honour `prefers-reduced-motion`.
- **Do** inline outline SVG icons at 1em, stroke 1.6, `currentColor`.

### Don't:
- **Don't** look like LinkedIn or Indeed: no grids of logo cards, no corporate blue, no sponsored or featured slots.
- **Don't** use monospace for anything other than the literal `true` / `false`, and don't build a terminal look (black screens, green mono text, prompts, cursors).
- **Don't** highlight a listing with color, badges, borders or position that the user didn't choose.
- **Don't** use green as a decorative fill or headline color; it is for action and "true" only.
- **Don't** put white text on the dark-theme green; use `on-accent` (#00230b).
- **Don't** add hard or offset shadows, hover lifts, or extra glass panels beyond the nav.
- **Don't** add uppercase eyebrows or kicker labels above headlines.
- **Don't** invent metrics, logos, or testimonials; show only what the data confirms.
