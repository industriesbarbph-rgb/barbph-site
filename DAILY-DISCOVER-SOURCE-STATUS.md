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

## Production state
All confirmed Theme Sources remain disabled until explicit production approval. Parked/unverified worlds must remain disabled.

## Patroller gate
Do not begin Patroller work until the Daily Discover source-world phase is considered complete under the project's locked sequencing. Parked worlds remain explicitly documented rather than being treated as successful.
