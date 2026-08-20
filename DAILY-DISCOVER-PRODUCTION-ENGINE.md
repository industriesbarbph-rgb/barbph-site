# Daily Discover Production Engine — Failover Layer

Status: implemented in `netlify/functions/daily-discover-production.mjs`.

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

## Daily duty behavior
For each Manila date the production endpoint:
1. returns the already-locked day record from Netlify Blobs if one exists;
2. otherwise selects one confirmed enabled source deterministically using spreadsheet weights;
3. tries that scheduled source twice using deterministic seeds;
4. if the scheduled source cannot produce the required safe set, requests the Barb Originals reserve;
5. if Barb Originals can supply the full set, it becomes the acting source for the rest of the Manila day;
6. if the reserve is also unavailable, the endpoint returns `SAFE_FALLBACK_REQUIRED` and serves no questionable third-party media.

The saved daily record retains both `scheduled_source` and `served_source`, so a reserve takeover is visible internally without requiring visitors to see an outage message.

## Shared daily lock
The selected/served set is stored in the site-wide `barbph-daily-discover` Netlify Blobs store under `day/YYYY-MM-DD` using strong consistency. Once a successful set is stored, all visitors receive that same set for the rest of the Manila day.

## Diagnostic mode
Diagnostics never write the production day record.

Examples:
- `/.netlify/functions/daily-discover-production?lab=1&force_source=NOAA`
- `/.netlify/functions/daily-discover-production?lab=1&force_source=NOAA&force_primary_fail=1`

The second route deliberately forces the scheduled source to fail and verifies that the engine attempts Barb Originals. Until at least 3 enabled Barb Originals images exist, the expected result is `SAFE_FALLBACK_REQUIRED`; after the reserve is populated, the expected result is `service_mode: barb_reserve` with `served_source: Barb Originals`.

## Important
The manual source-engine lab remains honest: individual source buttons still expose failures and do not silently use the reserve.
