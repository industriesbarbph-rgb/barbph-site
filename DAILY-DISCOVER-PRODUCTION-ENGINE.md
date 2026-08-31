# Daily Discover Production Engine - Continuous Source Layer

Current reconciliation: **2026-08-31 (Manila)**

Current production Daily Discover is centered on `netlify/functions/daily-stream.mjs`, exposed to ordinary visitors through `netlify/functions/daily-stream-public.mjs` and driven in the browser by `continuous-source-controller.js`.

The older `daily-discover-production.mjs` fixed daily-set engine remains in the repository as compatibility/history and as evidence of the Aug 20 to Aug 21 production rollover verification.

## Source eligibility

The current engine reads live `Theme Sources` rows. A normal source is eligible only when:

- `enabled=yes`
- weight is above zero
- `adapter_key` is present
- `production_status` is `PRODUCTION_READY` or `PRODUCTION`

This makes source eligibility status-driven rather than dependent on the old nine-source `PASSED` list.

## One scheduled source per Manila day

The engine selects and locks one scheduled source for the Manila date. When more than one eligible source exists, weighted selection avoids repeating yesterday's scheduled source when another eligible choice is available.

The day control record preserves the selected source plus its batch size, rotation interval, refresh interval, rights rule, adapter key, and region.

## Continuous batches

The selected source owns the Daily Discover stream for that Manila day. The engine repeatedly refreshes rights-safe batches from that source rather than stopping after one fixed three-image set.

Admin Sheet controls are clamped to safe runtime ranges for batch size, rotation interval, and refresh interval.

## Continuity and failover order

The current continuity order is:

1. Serve the current batch while it is still fresh.
2. Refresh from the same scheduled source when due.
3. If the source degrades, retry with bounded backoff.
4. During backoff, serve same-source last-known-good material when available.
5. If safe same-source material is unavailable, request Barb Originals.
6. If Barb Originals is also unavailable, return `SAFE_FALLBACK_REQUIRED` rather than questionable third-party media.

A degraded source can later recover. Successful retrieval moves service back to the scheduled source and records a recovery event.

## Admin hold / kill switch

If the scheduled source is disabled or loses a production-ready status during its day, production treats it as an Admin hold.

The engine must not keep serving cached institutional material after that hold. It attempts Barb Originals instead. If the reserve cannot serve, the safe result is an explicit unresolved fallback condition.

## Persistent state and history

Production uses the `barbph-daily-discover` Netlify Blobs store for:

- daily control lock
- current stream state
- source health / retry state
- seen asset IDs
- same-source last-known-good cache
- compatibility day record
- cross-day history
- continuous event history

Lab mode uses isolated deploy-store state rather than the production store.

## Watchtower resynchronization

The stream accepts a resynchronization request after the Watchtower interlude. A successful post-Watchtower refresh is recorded as a source batch/recovery event rather than silently advancing unrelated source state.

## Historical verification retained

The Aug 20 to Aug 21, 2026 Manila-midnight verification proved the earlier persistent daily lock and cross-session history path: a new Aug 21 NASA/Mars set was created after midnight and a separate session read the same stored set.

That proof remains part of BarbPH history. It does not imply that the old fixed-set behavior is still the current homepage engine.
