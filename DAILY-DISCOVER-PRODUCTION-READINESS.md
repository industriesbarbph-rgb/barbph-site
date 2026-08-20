# Daily Discover Production Readiness Gate

Status: implemented as a read-only Netlify diagnostic in `netlify/functions/daily-discover-readiness.mjs`.

## Purpose
This gate reports the safety/readiness state of Daily Discover without itself changing production state.

The readiness endpoint does not enable any source, write history, create a Daily Discover set, or modify spreadsheet controls.

## What it checks
- `Theme Sources` can be read.
- Only lab-confirmed worlds are eligible for automatic production duty.
- It flags any parked/unverified world that is accidentally enabled.
- It reports which confirmed worlds are currently production-enabled.
- It reports which confirmed worlds are armable by weight/configuration.
- It checks the `Barb Originals` reserve and requires at least 3 enabled unique image URLs.
- It reports whether Europeana, NYPL, and BHL credentials are configured without exposing secret values.
- It reads the shared Netlify Blobs state to report whether today already has a locked set and how many days of shared history exist.

## Readiness states
- `BLOCKED_THEME_SOURCES` — spreadsheet source controls cannot be read.
- `BLOCKED_UNVERIFIED_SOURCE_ENABLED` — a parked/unverified source is enabled and must not enter production.
- `WAITING_FOR_RESERVE_AND_ARMING` — no production source is enabled and Barb Originals is not yet ready.
- `ARMED_WITHOUT_RESERVE` — production sources are enabled but Barb Originals has fewer than 3 enabled unique images.
- `READY_TO_ARM` — reserve is ready, but no confirmed source is enabled yet.
- `ARMED_WITH_RESERVE` — at least one confirmed source is enabled and Barb Originals is ready.

## Verified current state — 2026-08-21 Manila

The earlier `WAITING_FOR_RESERVE_AND_ARMING` expectation is historical and no longer describes production.

- NASA is deliberately production-armed as a confirmed source.
- Barb Originals reserve is ready for the automatic fallback path.
- The first real production set was created before the Aug 20→21 rollover.
- Shared history is working.
- The real Manila-midnight rollover passed: Aug 21 created a new NASA/Mars daily set while loading Aug 20 history.
- A separate-session request returned the same Aug 21 daily set with `cache_hit:true`, proving the persisted daily lock was read.
- No additional source was armed by this documentation update.

The readiness gate remains diagnostic only; runtime source controls remain the authority for its exact live status value.

## Endpoint
`/.netlify/functions/daily-discover-readiness`

This endpoint is for internal diagnostics. Do not surface it as a public homepage feature.
