# Daily Discover Production Readiness Gate

Status: implemented as a read-only Netlify diagnostic in `netlify/functions/daily-discover-readiness.mjs`.

## Purpose
This gate answers one question without changing production state: **what is still blocking Daily Discover from being safely armed?**

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

## Expected current state
At the time this gate was added, production remained intentionally unarmed and Barb Originals was still waiting for at least 3 enabled user-owned images. Therefore the expected state is `WAITING_FOR_RESERVE_AND_ARMING` until those two deliberate gates are changed.

## Endpoint
`/.netlify/functions/daily-discover-readiness`

This endpoint is for internal diagnostics. Do not surface it as a public homepage feature.
