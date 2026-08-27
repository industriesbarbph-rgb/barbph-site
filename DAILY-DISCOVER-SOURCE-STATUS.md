# Daily Discover Source Status — 2026-08-20

Operational shorthand: **15/15 entries accounted for — 9 confirmed lab-success sources, 6 parked/waiting entries.**

Important nuance: Barb Originals is included in the waiting/accounting total, but it is an **emergency reserve**, not a normal public rotation world.

## Confirmed lab success
- The Met Open Access — ✅ rotating 3 assets
- NASA — ✅ rotating 3 assets
- Smithsonian Open Access — ✅ rotating 3 assets
- Library of Congress — ✅ rotating 3 assets
- NOAA — ✅ rotating 3 assets
- USGS — ✅ rotating 3 assets
- Art Institute of Chicago — ✅ rotating 3 assets
- Cleveland Museum of Art — ✅ rotating 3 assets
- National Gallery of Art — ✅ rotating 3 assets

## Public worlds built but parked / waiting
- Europeana — 🅿️ adapter built; requires `EUROPEANA_API_KEY`
- New York Public Library — 🅿️ adapter built; requires `NYPL_API_TOKEN`
- Biodiversity Heritage Library — 🅿️ adapter built; requires `BHL_API_KEY`
- Getty Open Content — 🅿️ current rights-safe retrieval is not yet yielding enough explicit CC0 image records
- Wildcard — 🅿️ intentionally parked until a pre-approved rights-safe pool is defined

## Emergency reserve waiting
- Barb Originals — 🅿️ emergency reserve; readiness requires at least 3 enabled unique valid images
- 3 is only the minimum. The reserve may and preferably will contain more images.

## Locked operational decision
Barb Originals is not a normal weighted source world. It is the emergency reserve for a scheduled public world that cannot serve a safe Daily Discover set. Manual lab tests still expose failures rather than hiding them behind reserve content.

## Production state — historical 2026-08-20
All confirmed Theme Sources remained disabled until explicit production approval. Parked/unverified worlds were required to remain disabled.

## Patroller gate — historical sequencing note
The original source-world phase used a temporary Patroller gate. Later project reconciliation separated the Patroller track from BarbPH production, so this gate is historical rather than a current dependency.

## Reconciliation — 2026-08-27 Manila

The 15-entry accounting remains valid and is now expressed more precisely as:

- **9 confirmed lab-success public sources** eligible for the production pool;
- **5 parked/waiting public source worlds**: Europeana, New York Public Library, Biodiversity Heritage Library, Getty Open Content, and Wildcard;
- **1 emergency reserve**: Barb Originals, which is not a weighted public source.

The current production scheduler in `netlify/functions/daily-discover-schedule.mjs` explicitly whitelists the same nine confirmed public sources in its `PASSED` set. Eligibility still additionally depends on the live `Theme Sources` controls (`enabled=yes` and positive weight), so this document does not claim that all nine are simultaneously armed.

The parked reasons remain unchanged unless a later validation explicitly supersedes them:

- Europeana — requires `EUROPEANA_API_KEY`.
- New York Public Library — requires `NYPL_API_TOKEN`.
- Biodiversity Heritage Library — requires `BHL_API_KEY`.
- Getty Open Content — rights-safe retrieval has not yet yielded enough explicit CC0 image records.
- Wildcard — still requires a pre-approved rights-safe pool.

Barb Originals has since been documented as ready for the automatic emergency fallback path, while retaining its reserve-only role. No parked public source is reclassified as passed by this reconciliation.
