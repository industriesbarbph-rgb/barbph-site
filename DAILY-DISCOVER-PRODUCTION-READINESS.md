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

## Verified state — 2026-08-21 Manila

The earlier `WAITING_FOR_RESERVE_AND_ARMING` expectation became historical once production was armed.

- NASA was deliberately production-armed as a confirmed source.
- Barb Originals reserve was ready for the automatic fallback path.
- The first real production set was created before the Aug 20→21 rollover.
- Shared history was working.
- The real Manila-midnight rollover passed: Aug 21 created a new NASA/Mars daily set while loading Aug 20 history.
- A separate-session request returned the same Aug 21 daily set with `cache_hit:true`, proving the persisted daily lock was read.
- No additional source was armed by that documentation update.

The readiness gate remains diagnostic only; runtime source controls remain the authority for its exact live status value.

## Reconciliation — 2026-08-27 Manila

- The nine-source production eligibility whitelist remains unchanged in the current schedule code.
- The five parked public worlds remain excluded from automatic production eligibility.
- Barb Originals remains reserve-only and is documented as ready for fallback.
- Live enablement/weight values remain controlled by `Theme Sources`; this file must not infer current arming solely from historical Aug 21 evidence.
- The Satellite schedule feature reads the same production/history state to present Yesterday, Today, and Tomorrow assignments; it does not expand the approved source pool.
- Current Netlify project state was checked as `ready` during this reconciliation. This documentation update does not itself alter source controls, Blobs history, or schedule state.

## Endpoint
`/.netlify/functions/daily-discover-readiness`

This endpoint is for internal diagnostics. Do not surface it as a public homepage feature.
