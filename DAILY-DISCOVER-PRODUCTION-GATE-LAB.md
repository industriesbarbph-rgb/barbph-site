# Daily Discover Production Gate Lab

Current reconciliation: **2026-08-31 (Manila)**

Status: implemented as `daily-discover-production-test.html` and updated for the current continuous source engine.

This is a `noindex,nofollow` internal diagnostic page.

## What the page does

- Reads `/.netlify/functions/daily-discover-readiness`.
- Shows current configured / production-ready / enabled source counts.
- Shows Barb Originals reserve readiness.
- Shows current daily lock/history information when available.
- Builds source dry-run buttons from the readiness response instead of a hard-coded nine-source list.
- Calls `/.netlify/functions/daily-stream?lab=1&force_source=...` for isolated source tests.
- Uses `force_fail=1` for an intentional failure/reserve test.

## Safety behavior

Lab mode uses isolated deploy-store state. It does not replace the production Manila-day control or production stream history.

## Page

`/daily-discover-production-test.html`
