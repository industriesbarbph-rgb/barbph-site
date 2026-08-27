# BarbPH Site Repository

This repository contains the current BarbPH public site, production infrastructure, internal labs, and locked implementation/build documents.

## Start here

For the current state of the project, read **`BARBPH-SOURCE-OF-TRUTH.md` first**. Older dated files remain useful historical evidence, but the source-of-truth file carries the latest reconciled state.

## Core build/status files

- `BARBPH-SOURCE-OF-TRUTH.md` — master current-state record
- `DAILY-DISCOVER-SOURCE-STATUS.md` — 15-entry source accounting and parked-source reasons
- `DAILY-DISCOVER-PRODUCTION-ENGINE.md` — Daily Discover production/failover engine
- `DAILY-DISCOVER-PRODUCTION-READINESS.md` — readiness rules and diagnostic states
- `DAILY-DISCOVER-EMERGENCY-RESERVE.md` — Barb Originals reserve policy
- `TICKER-BONES-SPEC.md` — Ticker interaction/layout specification
- `ALIVE-FAB-SPEC.md` — Alive FAB interaction specification
- `GLOBAL-SKY-WORLD-TIME-SPEC.md` — approved future concept
- `HOMEPAGE-PRIORITY-CONTROLLER.md` — Sponsor > Theme Override > Daily Discover priority logic
- `DIAGNOSTIC-HARDENING.md` — internal safety/diagnostic layer
- `SEO-SITEWIDE-PLUMBING.md` — crawl/indexing policy and Search Console handoff
- `BARBPH-LAUNCH-HARDENING-2026-08-21.md` and `BARBPH-PROTOTYPE-AUDIT-2026-08-21.md` — dated historical verification records

## Current source architecture

Daily Discover accounts for **15 total entries**:

- **9 confirmed lab-success public sources**: The Met Open Access, NASA, Smithsonian Open Access, Library of Congress, NOAA, USGS, Art Institute of Chicago, Cleveland Museum of Art, and National Gallery of Art;
- **5 parked/waiting public worlds**: Europeana, New York Public Library, Biodiversity Heritage Library, Getty Open Content, and Wildcard;
- **1 emergency reserve**: Barb Originals.

The production/schedule code explicitly whitelists the nine passed public sources. Live eligibility still depends on `Theme Sources` enablement and positive weight. Parked sources must not enter production without later explicit validation.

## Current production notes — reconciled 2026-08-27 Manila

- A production `index.html` homepage exists; older README/source-of-truth language saying the homepage had not launched is historical.
- Netlify project `barbphproducts` was checked as ready during reconciliation.
- Barb Originals remains reserve-only and is documented as ready for fallback.
- The Satellite Live Telecast schedule feature is implemented with Yesterday / Today / Tomorrow state derived from Daily Discover production/history.
- Satellite tab image loading now keeps the built-in SVG as a fallback and only swaps in the PNG after a successful preload, with cache busting.
- The current mechanical Yesterday / Today / Tomorrow visual is **not approved** and is being reconsidered toward a more realistic physical-machine treatment.
- The Satellite publication URL is supported by code but was not verified as complete during this reconciliation.

## Important guardrails

- Parked/unverified public source worlds must not enter automatic rotation.
- Barb Originals is an **emergency reserve**, not a weighted public source world.
- Historical NASA production evidence from Aug 21 must not be treated as proof of current live spreadsheet arming.
- Internal labs remain test surfaces and must keep their diagnostic/noindex role where configured.
- NOEN/Patroller remains a separate project track from BarbPH history and production state.
- Do not treat the current Satellite mechanical schedule visual as final.

## Internal labs

The repository retains internal Daily Discover source/production diagnostics, priority-controller tests, Alive/Ticker prototypes, and safe-system diagnostics. These are implementation/test surfaces, not substitutes for the current public homepage.
