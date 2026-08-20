# BarbPH — Source of Truth

Last reconciled: **2026-08-20**

This file is the master current-state record for the BarbPH site build. When older notes conflict with this file or a more specific locked spec, use this file plus the named locked spec.

## Current production posture

- Netlify project: `barbphproducts`
- GitHub repo: `industriesbarbph-rgb/barbph-site`
- Main branch is auto-deployed to Netlify.
- There is intentionally **no official `index.html` homepage yet**.
- Daily Discover production remains **OFF / unarmed** until explicit approval to enable confirmed Theme Sources.
- Internal diagnostic/prototype pages remain `noindex,nofollow` and outside the sitemap.

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

The priority controller exists, but no official homepage shell has been created.

## Ticker Bones — approved

Ticker Bones v2 is implemented as a prototype and its current interaction/visual identity is approved.

- panel opens to about 48% of viewport height
- Testimonials occupy the top 37.5% of the panel
- remaining 62.5% is a six-line exchange board
- three Product rows and three Program rows
- VT323 terminal/ticker typography
- black board with blue, green, white, and black-on-white treatments
- names plus short descriptions scroll continuously
- dramatic self-drawing, glowing, downward-tugging triangle
- drag/click/keyboard accessibility preserved
- Publications and The Bulletin are no longer part of Ticker Bones; they are reserved for future Patroller responsibilities

See `TICKER-BONES-SPEC.md`.

## Alive FAB — interaction approved, skin pending

The wordless bottom-right orb interaction is implemented and approved:

- closed state contains no visible words
- opens Products, Programs, Partnerships
- Products and Programs are active
- Partnerships remains visible but inactive until its page exists
- final material/glow/skin is **not locked yet**

See `ALIVE-FAB-SPEC.md`.

## Daily Discover — current state

Source accounting shorthand remains:

**15/15 entries accounted for — 9 confirmed lab-success sources, 6 parked/waiting entries.**

Important nuance: one of the six waiting entries is **Barb Originals emergency reserve**, not a normal public rotation world.

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

Parked/waiting:

- Europeana
- New York Public Library
- Biodiversity Heritage Library
- Getty Open Content
- Wildcard
- Barb Originals reserve

No confirmed source is to be production-enabled without explicit approval.

## Barb Originals emergency reserve

Barb Originals is an emergency safety pool only.

- **3 enabled unique images is the minimum readiness threshold, not a maximum.**
- More than 3 images are encouraged.
- All valid enabled unique reserve images may be available to the reserve selector.
- A larger pool reduces repetition and increases resilience.
- Future family/category labels may be used to improve variety, but are not required for basic readiness.

See `DAILY-DISCOVER-EMERGENCY-RESERVE.md`.

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

## Internal diagnostics

Diagnostic hardening is complete. The safe-system lab checks important guardrails without enabling production sources or creating a homepage.

See `DIAGNOSTIC-HARDENING.md`.

## Current build sequence

1. Programs SEO — COMPLETE
2. Sitewide SEO plumbing — COMPLETE
3. Alive FAB interaction shell — COMPLETE
4. Ticker Bones v2 — COMPLETE / APPROVED
5. Diagnostic hardening — COMPLETE
6. Repo/source-of-truth documentation cleanup — COMPLETE with this reconciliation
7. Key-free source-world maintenance — NEXT in the existing backlog
8. Additional invisible homepage infrastructure — pending

The Global Sky / World Time / Seasons prototype is a newly approved feature track and may be scheduled as the user chooses; it does not override the safety guardrails above.

## Do not accidentally do these

- do not create the official homepage just to test a component
- do not arm Daily Discover without explicit approval
- do not enable parked/unverified sources
- do not treat Barb Originals as a weighted public source
- do not begin Patroller prematurely
- do not treat the current Alive FAB skin as final
- do not move Publications/The Bulletin back into Ticker Bones unless the user explicitly changes that decision
