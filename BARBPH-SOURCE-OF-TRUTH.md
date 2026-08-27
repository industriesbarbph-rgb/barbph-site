# BarbPH — Source of Truth

Last reconciled: **2026-08-27 (Manila)**

This file is the master current-state record for the BarbPH site build. Older dated specs and verification notes remain historical evidence; when they conflict with this file on current state, use this file plus the relevant locked spec.

## Status vocabulary

- **PROVEN** — verified in deployed/prod-capable state or by a real production-state test.
- **IMPLEMENTED** — present in current source.
- **PENDING** — intentionally unfinished, not visually approved, or still requires an operational decision.
- **HISTORICAL** — accurate for the date recorded but no longer the current state.

## Current production posture

- Netlify project: `barbphproducts`.
- GitHub repo: `industriesbarbph-rgb/barbph-site`.
- Main branch is connected to Netlify deployment.
- A production `index.html` homepage now exists. Earlier notes stating that no official homepage existed are **HISTORICAL**.
- Netlify project state was checked as **ready** during the Aug 27 reconciliation.
- Internal diagnostic/lab pages remain separate from ordinary public navigation and must continue to respect their noindex/test-surface role where configured.

## Daily Discover — source architecture

The source accounting is locked as:

**15 total entries = 9 confirmed lab-success public sources + 5 parked/waiting public worlds + 1 emergency reserve.**

### Nine confirmed public sources

- The Met Open Access
- NASA
- Smithsonian Open Access
- Library of Congress
- NOAA
- USGS
- Art Institute of Chicago
- Cleveland Museum of Art
- National Gallery of Art

The current schedule code explicitly whitelists these same nine sources in its `PASSED` set. Production eligibility additionally requires live `Theme Sources` controls to have `enabled=yes` and positive weight. Historical Aug 21 evidence proved NASA production duty and a real Manila-midnight rollover, but live spreadsheet controls remain the authority for current arming.

### Five parked/waiting public worlds

- Europeana — adapter built; requires `EUROPEANA_API_KEY`.
- New York Public Library — adapter built; requires `NYPL_API_TOKEN`.
- Biodiversity Heritage Library — adapter built; requires `BHL_API_KEY`.
- Getty Open Content — rights-safe retrieval has not yet yielded enough explicit CC0 image records.
- Wildcard — intentionally parked until a pre-approved rights-safe pool is defined.

Parked/unverified worlds must not enter automatic production rotation without later explicit validation.

### Barb Originals emergency reserve

Barb Originals is the single emergency reserve, not a normal weighted public source.

- Minimum readiness threshold: 3 enabled unique valid images.
- Reserve readiness was documented as proven/ready after the Aug 20 snapshot.
- If the scheduled public source cannot safely serve the required set, production may switch the Manila day to Barb Originals.
- If the reserve also cannot serve safely, the system must prefer a hard safe fallback rather than questionable third-party media.

See `DAILY-DISCOVER-SOURCE-STATUS.md`, `DAILY-DISCOVER-PRODUCTION-ENGINE.md`, `DAILY-DISCOVER-PRODUCTION-READINESS.md`, and `DAILY-DISCOVER-EMERGENCY-RESERVE.md`.

## Production verification retained from Aug 20→21

The Daily Discover production engine passed a real Manila-date rollover:

- Aug 20 was retained in shared history.
- The first Aug 21 production request created a new locked day set.
- NASA was the scheduled and served source in primary mode for that verification.
- A separate/incognito request returned the same persisted daily set with `cache_hit:true`.
- Shared daily locking and cross-day history were therefore proven in the observed production path.

These statements are retained as historical verification evidence; they do not by themselves claim the live Aug 27 source-control values.

## Satellite Live Telecast / transmission schedule

Implemented in the current BarbPH source:

- `satellite-tab.css`
- `satellite-tab.js`
- `satellite-tab.png`
- `netlify/functions/daily-discover-schedule.mjs`

The feature places a Satellite tab after EE and exposes a Yesterday / Today / Tomorrow transmission schedule derived from Daily Discover production/history state.

The schedule function:

- uses the same nine-source approved whitelist;
- reports scheduled versus served source and fallback state;
- forecasts Tomorrow from eligible enabled sources;
- reads an optional publication URL from Theme Sources;
- does not authorize parked sources or create a second source architecture.

### Satellite tab image state

History preserved:

- Aug 24: satellite tab feature added.
- Aug 24: a dedicated `satellite-tab.png` asset repair commit replaced the earlier bad asset state.
- Aug 27: image loading was hardened so the built-in SVG remains as a fallback and the PNG only replaces it after successful preload; the PNG request is cache-busted.

Current source therefore has a nonblank fallback path even if the PNG itself fails. Visual acceptance of the final satellite artwork remains separate from loading reliability.

### Mechanical schedule visual state

The Yesterday / Today / Tomorrow mechanism is **implemented but visually not approved**. The current direction under discussion is to replace the web-styled mechanical treatment with a more physically believable machine-like design. No such redesign is recorded as completed yet.

### Publication link

The code supports a publication URL through `publication_url` / `live_telecast_publication_url` in Theme Sources. No specific publication URL was verified during this Aug 27 reconciliation, so link completion remains **PENDING**.

## Live-telecast page design principle

The current concept is a zero-word, zero-scroll live-transmission experience in which the live broadcast/telecast is treated as the primary page object rather than ordinary content placed below explanatory copy. The visual theme is derived from transmission itself: satellite, signal, receiving/broadcast equipment, machinery, and schedule/time.

The final public wording for this concept is still being refined; do not treat earlier shorthand such as “baked in” as locked publication language.

## Ticker / Alive / other historical specs

Dated or component-specific specs remain authoritative for their locked implementation details unless later explicitly superseded. Earlier statements that tied all Patroller work to Daily Discover sequencing are historical; Patroller/NOEN remains a separate project track and must not be merged into BarbPH production history.

## SEO state

Completed historical work includes Programs SEO repair and sitewide crawl plumbing. Search Console/domain/indexing work should be evaluated against the current production homepage rather than the earlier pre-homepage assumptions.

## Current unfinished tasks — Aug 27

1. Verify the Satellite tab image/fallback behavior visually on the deployed homepage.
2. Redesign the Yesterday / Today / Tomorrow mechanism conceptually toward a realistic physical machine before touching production styling.
3. Supply and verify the publication link used by the Satellite schedule feature.
4. Keep the nine-source production whitelist and five parked public worlds accurately documented; do not silently promote parked sources.
5. Preserve Barb Originals as reserve-only.

## Do not accidentally do these

- do not enable parked/unverified source worlds without explicit validation;
- do not treat Barb Originals as a weighted public source;
- do not infer current live source arming from the Aug 21 NASA verification alone;
- do not treat the current mechanical Satellite schedule visual as approved;
- do not claim the Satellite publication link is complete until a URL is verified;
- do not merge NOEN/Patroller history into BarbPH history;
- do not treat old pre-homepage statements as current production truth.
