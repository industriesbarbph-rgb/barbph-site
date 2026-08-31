# BarbPH - Source of Truth

Last reconciled: **2026-08-31 (Manila)**

This is the master current-state record for the BarbPH site. Older dated specs, commits, labs, and screenshots remain historical evidence. When an older document conflicts with this file on current production state, this file and the live implementation take priority.

## Status vocabulary

- **PRODUCTION** - currently part of the public production architecture.
- **READY** - technically eligible/validated but still governed by live Admin Sheet controls.
- **HOLD / BUILDING / PARKED / PENDING** - intentionally excluded from automatic production duty.
- **HISTORICAL** - accurate for an earlier stage but superseded in current production.
- **PLANNED** - approved idea/specification that is not yet production.

## Production posture

- Public domain: `https://barbph.com/`
- GitHub repository: `industriesbarbph-rgb/barbph-site`
- Production branch: `main`
- Repository history records `main` as connected to the Netlify production project `barbphproducts`; therefore treat a main-branch push as production-deploy-capable.
- Production `index.html` exists.
- Internal labs remain separate from normal visitor navigation and must keep `noindex,nofollow` behavior where applicable.

## Public surfaces

- `/` - homepage and Daily Discover world
- `/products` - Products catalog
- `/programs` - Programs catalog
- `/publications` - Publications / Bulletin surface
- `/partnership` - Partnership portal
- `/systems` - redirects to the homepage Systems & Transmission Logs view
- EE / Everything Else - external published Google Slides destination linked from the homepage

## Admin Sheet control plane

The `barbph-admin` Google Sheet is an active control/data plane, not merely a planning file.

Current production integrations include:

- Products and Programs catalog data
- Publications and The Bulletin
- Theme Sources
- Sponsor Takeovers
- Theme Override
- Partnership Config
- Barb Originals reserve
- related source/reporting fields

Products and Programs are available through the live `catalog-feed` function and are also baked into static fallback blocks by the hourly GitHub catalog rebuild.

## Catalog engine - reconciled August 31

The catalog rebuild workflow is scheduled hourly and runs `node build-catalog.js`.

The failure found on August 31 was a module mismatch: `package.json` declares `type: module`, while `build-catalog.js` still used CommonJS `require(...)`. The repair changes the builder to Node ES-module imports and normalizes GitHub blob URLs to raw media URLs.

Programs also had a separate live-rendering defect: its browser-side catalog renderer discarded `photo_url` and always emitted an empty photo frame. That renderer is repaired so live Program cards use the same image behavior as Products.

## Homepage priority controller

Locked priority:

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

The controller uses Manila date boundaries. When neither a valid sponsor nor valid theme override wins, the homepage points to `/.netlify/functions/daily-stream-public`.

## Daily Discover - current continuous architecture

Daily Discover now uses the continuous engine (`daily-stream.mjs` plus the public cached wrapper) rather than relying only on the earlier fixed daily-set engine.

### Live Theme Sources accounting

Current configured Theme Source entries: **21**.

**Enabled + production-ready (11):**

- The Met Open Access
- NASA
- Smithsonian Open Access
- Library of Congress
- NOAA
- USGS
- Art Institute of Chicago
- Cleveland Museum of Art
- National Gallery of Art
- NHCP National Memory Project
- National Heritage Board Singapore

**Disabled / non-production (10):**

- Europeana - HOLD
- New York Public Library - HOLD
- Biodiversity Heritage Library - HOLD
- Getty Open Content - HOLD
- Wildcard - HOLD
- National Diet Library - BUILDING
- National Folk Museum of Korea - PARKED
- National Palace Museum - PENDING_API_KEY
- Old Photos of Hong Kong - INGESTION_REQUIRED
- Khastara / National Library of Indonesia - BUILDING

Barb Originals is maintained separately as the emergency reserve and is not counted among the 21 Theme Source entries.

### Eligibility rule

A normal source is automatically eligible only when all are true:

- `enabled=yes`
- weight is above zero
- `adapter_key` is present
- `production_status` is `PRODUCTION_READY` or `PRODUCTION`

The readiness function reports unsafe enabled rows rather than silently permitting them.

### Continuous behavior

For each Manila day the engine locks one scheduled source. It then serves continuous batches from that source using Admin Sheet batch/rotation/refresh settings.

The current resilience order is:

1. use a still-fresh current batch;
2. refresh from the same scheduled source;
3. on degradation, use same-source last-known-good material during retry backoff when available;
4. if safe same-source material is unavailable, use Barb Originals;
5. if neither path is safe, return `SAFE_FALLBACK_REQUIRED` rather than questionable institutional media.

The engine can recover from degraded/cache/reserve mode back to the scheduled source after a later successful retrieval. This supersedes the older whole-day reserve-takeover rule.

If an administrator disables or de-authorizes the scheduled source during its day, the engine treats that as an Admin hold and does not continue serving that institution's cached material as though approval still existed.

## Watchtower interlude

Watchtower is integrated as an hourly interlude around the top of the hour. The browser controller preloads the frame, uses a bounded readiness/fail-safe window, shows the interlude for the configured period, unloads it afterward, and requests a Daily Discover resynchronization when BarbPH resumes.

## Systems & Transmission Logs

Current BarbPH includes a public operational ledger backed by persistent state. Public events are sanitized and include source/transmission conditions such as selection, refresh, degradation, same-source cache use, Barb Originals use, recovery, Watchtower transitions, Admin hold, and unresolved conditions.

Permanent public Systems history begins **2026-08-30**.

## Publications and Partnership

Publications / The Bulletin are read dynamically from the Admin Sheet through `content-feed.mjs`.

Partnership is now a real public page. The information/guide destination can be controlled through `Partnership Config` and `partnership-info.mjs`.

## SEO / routing

Canonical public content currently includes the homepage, Products, Programs, Publications, and Partnership.

Systems is a state/view of the homepage rather than an independent canonical document. `/systems` redirects into `/?systems=open`, so the redirect-only Systems URL should not be treated as a separate canonical sitemap page.

## Historical architecture retained

The following are retained as implementation history and must not be deleted simply because production moved on:

- Satellite tab assets/scripts/styles
- mechanical Transmission Register files
- older fixed daily-set production/schedule functions and tests
- dated launch-hardening and prototype audit records

The Satellite live-telecast tab itself was removed from the current homepage on **2026-08-30**. Its files remain historical evidence.

The real Aug 20 to Aug 21 Manila-midnight Daily Discover verification also remains valuable historical proof of persistent daily state and cross-session locking, even though the current engine later evolved into continuous streaming.

## Planned, not production

- Global Sky / World Time / Seasons remains planned.
- NOEN/Patroller remains a separate project track and must not be merged into BarbPH production history.

## Current guardrails

- Do not enable a held/building/parked/pending source without completing its stated unlock condition.
- Do not treat the existence of adapter code as permission to enable a source.
- Do not treat Barb Originals as a weighted institutional source.
- Do not serve institutional cache after an Admin hold disables that source.
- Do not let diagnostic state mutate production state.
- Do not erase historical architecture when current-state docs are reconciled.
