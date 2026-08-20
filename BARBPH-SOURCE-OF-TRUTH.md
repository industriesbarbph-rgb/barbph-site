# BarbPH — Source of Truth

Last reconciled: **2026-08-21 (Manila)**

This file is the master current-state record for the BarbPH site build. When older notes conflict with this file or a more specific locked spec, use this file plus the named locked spec.

## Status vocabulary

- **PROVEN** — verified in the deployed/prod-capable system or by a real production-state test.
- **PROTOTYPE-ONLY** — implemented and testable, but not the official root homepage.
- **PENDING** — intentionally not launched, not locked, or still requires a product/operational decision.

## Current production posture

- Netlify project: `barbphproducts`
- GitHub repo: `industriesbarbph-rgb/barbph-site`
- Main branch is auto-deployed to Netlify.
- There is intentionally **no official `index.html` homepage yet**. **PENDING / intentionally withheld.**
- Daily Discover is now **production-armed with NASA** as a confirmed source. **PROVEN.**
- Barb Originals emergency reserve is populated/readied for automatic fallback. **PROVEN.**
- Internal diagnostic/prototype pages remain `noindex,nofollow` and outside the sitemap.
- None of the Aug 20–21 verification work constitutes root-homepage launch.

## Official future homepage — locked direction

The future homepage is a full-bleed visual stage with no permanent center-stage copy by default.

Exactly three persistent hero controls are planned:

1. top-center Ticker Bones triangle
2. roaming Coach Doll Patroller
3. bottom-right Alive FAB

The lower/footer world retains the starfield direction and the exact phrase **Behind the Builds**.

Homepage priority is locked as:

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

The priority controller exists, but no official homepage shell has been promoted to `index.html`.

## Ticker Bones — approved interaction; pre-birthday shell only

Ticker Bones v2 is implemented as a prototype and its current interaction/visual identity is approved.

- panel opens to about 48% of viewport height
- Testimonials occupy the top 37.5% of the panel
- remaining 62.5% is a six-line exchange board
- three Product rows and three Program rows
- VT323 terminal/ticker typography
- black board with blue, green, white, and black-on-white treatments
- names plus short descriptions scroll continuously
- dramatic self-drawing, glowing, downward-tugging triangle
- drag/click/keyboard accessibility preserved and hardened against interrupted pointer/focus states
- Publications and The Bulletin are no longer part of Ticker Bones; they are reserved for future Patroller responsibilities
- the Ticker **pre-birthday shell works in the launch prototype**. **PROTOTYPE-ONLY / verified.**

Ticker's own birthday/launch remains a separate milestone from the BarbPH homepage launch. Do not treat prototype presence as Ticker's birthday.

See `TICKER-BONES-SPEC.md` and `BARBPH-LAUNCH-HARDENING-2026-08-21.md`.

## Alive FAB — interaction approved, skin pending

The wordless bottom-right orb interaction is implemented and approved:

- closed state contains no visible words
- opens Products, Programs, Partnerships
- Products and Programs are active
- Partnerships remains visible but inactive until its page exists
- accessibility/focus behavior has been hardened in the prototype
- final material/glow/skin is **not locked yet**

Status: **PROTOTYPE-ONLY** until the official homepage is launched.

See `ALIVE-FAB-SPEC.md`.

## Daily Discover — verified production state

Source accounting shorthand remains:

**15/15 entries accounted for — 9 confirmed lab-success public sources, 5 parked/waiting public entries, plus Barb Originals emergency reserve.**

Confirmed lab-success public sources:

- The Met Open Access
- NASA
- Smithsonian Open Access
- Library of Congress
- NOAA
- USGS
- Art Institute of Chicago
- Cleveland Museum of Art
- National Gallery of Art

Current arming:

- **NASA is production-armed. PROVEN.**
- Other confirmed sources remain eligible only if deliberately enabled/weighted; this reconciliation does not arm any additional source.

Parked/waiting public entries:

- Europeana
- New York Public Library
- Biodiversity Heritage Library
- Getty Open Content
- Wildcard

### Real production evidence — Aug 20 → Aug 21 Manila

The production engine has now passed a real Manila-date rollover rather than only a synthetic/lab test:

- an Aug 20 production day existed and was retained in shared history;
- after real Manila midnight, the first Aug 21 request created a **new** daily set with `date_manila: 2026-08-21` and `cache_hit:false`;
- NASA was both `scheduled_source` and `served_source`, in `service_mode: primary`;
- the Aug 21 set contained a new Mars-family world and loaded one prior history day;
- a separate/incognito request returned the **same Aug 21 Mars set / same daily_set_id** with `cache_hit:true`, proving the persisted daily lock was being read rather than regenerated;
- shared history and the cross-day anti-repeat layer are therefore operational in the observed production path.

Status: **PROVEN.** Same-URL browser/edge caching can make an old first-response `cache_hit:false` remain visible; use a separate/uncached request for lock diagnostics.

## Barb Originals emergency reserve

Barb Originals is an emergency safety pool only; it does not compete by weight with public source worlds.

- Reserve readiness is now **PROVEN / ready** for the current production fallback path.
- **3 enabled unique images is the minimum readiness threshold, not a maximum.**
- More than 3 images are encouraged.
- All valid enabled unique reserve images may be available to the reserve selector.
- A larger pool reduces repetition and increases resilience.
- Future family/category labels may be used to improve variety, but are not required for basic readiness.

See `DAILY-DISCOVER-EMERGENCY-RESERVE.md`.

## Newsletter — headless capture verified

- The homepage prototype posts newsletter email headlessly through `newsletter-submit` rather than navigating the visitor away. **PROTOTYPE-ONLY / verified.**
- Server-side email validation, dynamic Google Form field discovery, required hidden-field completion, explicit success/error JSON, timeout/error recovery, and button restoration are implemented.
- The Newsletter mirror formula has been corrected and is treated as **FIXED / verified tonight**.
- This does not launch the root homepage; it verifies the capture path used by the prototype.

## Patroller boundary — separate project and separate birthday

The Coach Doll Patrollers are a separate project track from BarbPH homepage production. Their development may proceed independently; the old instruction to “not begin Patroller prematurely” is retired because it incorrectly coupled the two tracks.

- BarbPH homepage launch does **not** equal a Patroller birthday.
- Ticker birthday does **not** equal a Patroller birthday.
- A Patroller's own launch/birthday must be recorded separately.
- Patroller runtime/deployment work must not mutate BarbPH production state merely because the projects can later appear together visually.

## Global Sky / World Time / Seasons — approved concept, not built

A future theme/interlude system has been approved conceptually:

- the existing atmospheric sky direction can become a global visual layer
- after a Daily Discover source rotation, a World Time interlude may run
- major cities can appear one at a time in full bleed with live local time, country, continent, and season context
- after individual city moments, major cities can be shown together at the same instant
- representative locations may be chosen to show all four seasons concurrently
- live time should use IANA time zones/browser time formatting where possible, avoiding a paid time API
- season labels must not falsely force tropical/equatorial climates into four-season terminology
- live weather is a separate future decision and is not required for time/season functionality

Status: **PENDING / concept approved, not built.**

See `GLOBAL-SKY-WORLD-TIME-SPEC.md`.

## SEO state

Completed:

- Programs SEO repair
- sitewide crawl plumbing
- robots/sitemap policy for current real pages

Pending hands-on checkpoint:

- Google Search Console verification for `barbph.com`
- submit sitemap
- inspect/request indexing for current public pages after canonical custom-domain behavior is confirmed
- add homepage root only after official homepage launch

## Internal diagnostics and prototype hardening

Diagnostic hardening is complete. The safe-system lab checks important guardrails without creating a homepage. The Aug 21 launch hardening pass additionally improved Daily Discover image admission/fallback, sponsor-media fallback, newsletter timeout/error behavior, Ticker pointer interruption handling, and Alive FAB focus/accessibility behavior.

See `DIAGNOSTIC-HARDENING.md`, `BARBPH-PROTOTYPE-AUDIT-2026-08-21.md`, and `BARBPH-LAUNCH-HARDENING-2026-08-21.md`.

## Current build sequence

1. Programs SEO — COMPLETE
2. Sitewide SEO plumbing — COMPLETE
3. Alive FAB interaction shell — COMPLETE / PROTOTYPE-ONLY
4. Ticker Bones v2 — COMPLETE / APPROVED / PRE-BIRTHDAY PROTOTYPE
5. Diagnostic hardening — COMPLETE
6. Daily Discover production engine — ARMED WITH NASA / REAL MIDNIGHT ROLLOVER PROVEN
7. Barb Originals reserve — READY
8. Headless newsletter capture — WORKING IN PROTOTYPE; MIRROR FORMULA FIXED
9. Repo/source-of-truth reconciliation — COMPLETE through 2026-08-21
10. Official root homepage (`index.html`) — PENDING / intentionally not launched
11. Ticker birthday — SEPARATE PENDING MILESTONE
12. Coach Doll Patroller birthday(s) — SEPARATE PROJECT MILESTONE(S)

## Do not accidentally do these

- do not create or replace the official homepage just to test a component
- do not arm additional Daily Discover sources merely because NASA is armed
- do not enable parked/unverified sources
- do not treat Barb Originals as a weighted public source
- do not treat Ticker prototype presence as its birthday
- do not treat Patroller development or deployment as the BarbPH homepage launch
- do not treat the current Alive FAB skin or decorative footer globe as final
- do not move Publications/The Bulletin back into Ticker Bones unless the user explicitly changes that decision
