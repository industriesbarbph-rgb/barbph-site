# Daily Discover Production Readiness Gate

Current reconciliation: **2026-08-31 (Manila)**

Status: implemented as a read-only Netlify diagnostic in `netlify/functions/daily-discover-readiness.mjs`.

## Purpose

The readiness gate reports whether the current continuous source engine is safely configured. It does not enable a source, change spreadsheet controls, create production history, or alter the active stream.

## What it checks

- `Theme Sources` is readable.
- `Barb Originals` is readable.
- every enabled source has a production-ready status and adapter key;
- at least one production-ready source is enabled with positive weight;
- Barb Originals contains at least 3 enabled unique valid image URLs;
- current production Blobs state can be read when running in production context;
- current daily control, served source, service mode, health, retry timing, generation, event count, and history count.

## Current eligibility model

`PRODUCTION_READY` and `PRODUCTION` are the accepted ready states.

Inactive statuses such as `HOLD`, `BUILDING`, `PARKED`, `PENDING_API_KEY`, and `INGESTION_REQUIRED` remain out of automatic production unless their configuration is deliberately changed after validation.

## Current readiness states

- `BLOCKED` - one or more production blockers are present.
- `READY_WITH_WARNINGS` - no blocker, but an unknown/inconsistent inactive status needs attention.
- `READY_FOR_PRODUCTION` - the engine is armed safely, reserve protection is ready, and no unsafe source is enabled.

The endpoint also reports `production_armed` as a boolean and returns detailed blockers/warnings.

## Reconciled source counts

At the August 31 reconciliation, the live Theme Sources configuration contains:

- 21 configured sources
- 11 production-ready sources
- 11 enabled production sources
- 10 paused/disabled sources

These counts are configuration facts from the reconciliation, not a promise that they will never change. The endpoint always computes live counts from the Admin Sheet.

## Reserve gate

Barb Originals requires at least 3 enabled unique valid image URLs. The endpoint reports `available_count`, `minimum_required`, and `ready`.

## Safety guards reported by the endpoint

The current readiness response explicitly reports support for:

- one source per Manila day
- continuous batches
- same-source cache
- Barb Originals final fallback
- Admin kill switch
- Watchtower resynchronization
- exclusion of unverified sources from rotation

## Endpoint

`/.netlify/functions/daily-discover-readiness`

This endpoint is for diagnostics. Do not surface its raw technical response as ordinary homepage content.
