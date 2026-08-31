# Daily Discover Emergency Reserve - Current Policy

Current reconciliation: **2026-08-31 (Manila)**

## Purpose

Barb Originals is the emergency reserve for Daily Discover. It is not part of the normal weighted institutional/public-source rotation.

## Current continuous-engine duty order

1. Keep the scheduled public source for the Manila day.
2. Serve its current fresh batch while valid.
3. Refresh from that same source when due.
4. If retrieval degrades, use retry backoff and same-source last-known-good material when available.
5. If no safe same-source material can carry the stream, use Barb Originals.
6. If Barb Originals also cannot serve safely, return a hard safe fallback condition rather than questionable third-party media.

## Recovery behavior

Under the continuous engine, Barb Originals does **not** necessarily own the rest of the Manila day after one source failure.

The scheduled source remains the day's scheduled source. After backoff or an explicit resynchronization, the engine may attempt it again. A successful retrieval returns service to that source and records recovery.

This supersedes the older Aug 20 policy in which a Barb Originals takeover was described as lasting for the rest of the day. That older policy remains historical evidence of the earlier fixed-set engine.

## Admin hold behavior

If the administrator disables or de-authorizes the scheduled source, the engine treats that as an Admin hold and must not continue serving that institution's cached material.

Barb Originals is the preferred safe substitute during the hold. If the reserve is unavailable, the system returns `SAFE_FALLBACK_REQUIRED`.

## Reserve rules

- Reserve assets come from the `Barb Originals` Sheet tab.
- `enabled=yes` is required.
- 3 enabled unique valid images is the minimum readiness threshold, not a maximum.
- A larger reserve is preferred for resilience and variety.
- Barb Originals does not compete by weight with institutional/public sources.
- Held, building, parked, pending, or unverified public sources are not emergency substitutes.

## Diagnostics

The readiness endpoint reports reserve count and readiness. Lab-mode continuous source tests use isolated state and may intentionally force source failure to verify the safety chain without mutating the production day.
