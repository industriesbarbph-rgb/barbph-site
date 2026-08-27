# Daily Discover Production Engine — Failover Layer

Status: implemented in `netlify/functions/daily-discover-production.mjs` and **real production rollover verified 2026-08-21 Manila**.

## Confirmed production pool
Only source worlds that have already passed the 3-asset lab test are eligible for automatic production duty:
- The Met Open Access
- NASA
- Smithsonian Open Access
- Library of Congress
- NOAA
- USGS
- Art Institute of Chicago
- Cleveland Museum of Art
- National Gallery of Art

A source must also be `enabled=yes` in `Theme Sources` and have `weight > 0`. Parked worlds are excluded even if accidentally enabled.

Historical arming evidence: NASA was deliberately production-armed during the Aug 20→21 production verification. Live spreadsheet controls remain authoritative for current arming; this document does not infer that historical setting remains unchanged.

## Daily duty behavior
For each Manila date the production endpoint:
1. returns the already-locked day record from Netlify Blobs if one exists;
2. otherwise selects one confirmed enabled source deterministically using spreadsheet weights;
3. tries that scheduled source twice using deterministic seeds;
4. if the scheduled source cannot produce the required safe set, requests the Barb Originals reserve;
5. if Barb Originals can supply the full set, it becomes the acting source for the rest of the Manila day;
6. if the reserve is also unavailable, the endpoint returns `SAFE_FALLBACK_REQUIRED` and serves no questionable third-party media.

The saved daily record retains both `scheduled_source` and `served_source`, so a reserve takeover is visible internally without requiring visitors to see an outage message.

## Shared daily lock and history
The selected/served set is stored in the site-wide `barbph-daily-discover` Netlify Blobs store under `day/YYYY-MM-DD` using strong consistency. Once a successful set is stored, all visitors receive that same set for the rest of the Manila day.

Shared history is also active for cross-day repeat protection. The production path records prior day assets/families so a new Manila day can avoid recent exact assets and meaningful families according to the configured windows.

## Real Manila-midnight verification — Aug 20 → Aug 21, 2026

This engine passed a real clock rollover, not merely a forced/lab date test:

- Aug 20 existed as the prior production/history day.
- The first request after Manila midnight reported `date_manila: 2026-08-21`, loaded one prior history day, selected/served NASA in primary mode, and created a new Mars-family daily set with `cache_hit:false`.
- A separate/incognito request returned the same Aug 21 Mars set and same `daily_set_id` with `cache_hit:true`.
- This proved the observed production path both created the new day's lock and subsequently read that persisted lock.

Operational note: browser/edge caching on an identical URL can replay the first response and make `cache_hit:false` appear stale. For lock diagnostics, use a separate/uncached request rather than treating a same-URL refresh as authoritative.

## Barb Originals reserve

Barb Originals remains emergency reserve only, never a weighted public source. The reserve is documented as ready for the automatic fallback path. The minimum readiness threshold remains 3 enabled unique valid images; a larger pool is preferred.

## Satellite schedule consumer — added Aug 24, reconciled Aug 27

`netlify/functions/daily-discover-schedule.mjs` is a read-only schedule-facing consumer of the same production/history state. It exposes Yesterday, Today, Tomorrow, the scheduled/served distinction, fallback state, and an optional publication URL to the Satellite tab. It does **not** create a second source pool or authorize parked sources.

The schedule function contains the same nine-source `PASSED` whitelist and still requires `enabled=yes` plus positive weight for forecasting. Therefore the 15-entry architecture remains: 9 passed public sources, 5 parked public worlds, and Barb Originals as reserve.

## Diagnostic mode
Diagnostics never write the production day record.

Examples:
- `/.netlify/functions/daily-discover-production?lab=1&force_source=NOAA`
- `/.netlify/functions/daily-discover-production?lab=1&force_source=NOAA&force_primary_fail=1`

The second route deliberately forces the scheduled source to fail and verifies that the engine attempts Barb Originals. With the reserve ready, a successful forced takeover is expected to report `service_mode: barb_reserve` with `served_source: Barb Originals`; if the reserve cannot provide a full eligible set, the safe result remains `SAFE_FALLBACK_REQUIRED`.

## Important
The manual source-engine lab remains honest: individual source buttons still expose failures and do not silently use the reserve.
