# Daily Discover Production Gate Lab

Status: implemented as `daily-discover-production-test.html`.

This is a `noindex,nofollow` internal diagnostic page. It is not the future BarbPH homepage.

## What the page can do
- Refresh the read-only production readiness status.
- Show whether production is armed.
- Show the Barb Originals reserve count.
- Show shared-history day count.
- Show current readiness blockers.
- Dry-run each of the 9 confirmed source worlds through the production engine using `lab=1`.
- Force a source tantrum using `force_primary_fail=1` to verify the Barb Originals takeover path once the reserve is populated.

## Safety behavior
Lab-mode runs do not lock the Manila day and do not write production history. A forced tantrum returning `SAFE_FALLBACK_REQUIRED` is expected while Barb Originals has fewer than 3 enabled images.

## Page
`/daily-discover-production-test.html`
