# BarbPH Prototype Audit — 2026-08-21

Scope: prototype and supporting infrastructure only. No `index.html` was created/replaced; Products/Programs, spreadsheet permissions, source arming, sponsor state, and root homepage publication were untouched.

## Verified repo state

- Official launch prototype is isolated at `homepage-launch-test.html` and remains `noindex,nofollow`.
- Homepage priority controller implements the locked chain: Sponsor Takeover → Theme Override → Daily Discover.
- Daily Discover production function uses Manila-local dates, strong-consistency Netlify Blobs, daily locks, shared history, exact-asset repeat protection, family repeat protection, and Barb Originals as reserve rather than a weighted public source.
- Ticker pre-birthday shell is present in the launch prototype and uses the approved drag/click/keyboard Ticker Bones controller.
- Alive FAB is present and keeps Partnerships visible but inactive while Products/Programs remain active.
- Newsletter UI posts headlessly to `newsletter-submit`; the function validates email, resolves current public Google Form entry IDs dynamically, and returns explicit success/error JSON.
- Starfield/footer world is prototype-only and retains the locked phrase `Behind the Builds`.

## Concrete inconsistencies / blockers

1. **Source-of-truth drift (documentation blocker).** `BARBPH-SOURCE-OF-TRUTH.md` still says Daily Discover production is OFF/unarmed and says Patroller must not begin prematurely. This no longer matches the verified Aug 20–21 production state and the now-separate Coach Doll Patrols/NOEN project. A dedicated truth-sync pass should reconcile this without changing runtime state.
2. **Footer clock semantics.** The prototype footer clock/date use the visitor browser's local timezone (`Intl.DateTimeFormat(undefined, ...)`). That is valid as a visitor-local clock, but the visual currently does not label the timezone/location. If the intended footer is specifically Manila/global-world time, this needs an explicit product decision before launch.
3. **Prototype globe is not launch-locked.** The current CSS globe is a decorative placeholder; visual review already identified it as too atom-like. This is polish, not an engine blocker.
4. **Daily Discover HTTP edge-cache observability.** A normal browser refresh can replay a cached first-response payload showing `cache_hit:false`, while a separate uncached/incognito request shows the Blob-backed daily lock as `cache_hit:true`. This does not invalidate the daily lock, but diagnostics should not rely on a same-URL browser refresh alone.
5. **Priority-controller dependency behavior is fail-closed.** If either Sponsor Takeovers or Theme Override sheet becomes unreadable, the controller returns `CONTROL_UNAVAILABLE` instead of silently falling through to Daily Discover. This is safe, but it means sheet readability is a homepage availability dependency and should be monitored before launch.

## Tests / evidence reviewed

- Aug 21 Manila Daily Discover response: NASA selected/served, primary mode, 3 Mars-family assets, shared history loaded from Aug 20, new daily set created.
- Separate-session repeat request: same Aug 21 daily set returned with `cache_hit:true`, proving persisted daily lock.
- `homepage-priority.mjs`: validated priority order, HTTPS sponsor-media validation, active-window validation, conflict policy, and fail-closed control behavior.
- `ticker-bones.js`: validated click, pointer drag thresholds, Escape handling, aria-expanded/aria-hidden updates, and body scroll lock.
- `alive-fab.js`: validated wordless main button, Products/Programs navigation, inactive Partnerships, outside-click close, Escape close, and Patroller-ready nudge hook.
- `newsletter-submit.mjs`: validated server-side email validation, dynamic Google Form field discovery, hidden required-field completion, no-store responses, and explicit upstream failure handling.
- `homepage-launch-test.html`: validated prototype isolation/noindex, Daily Discover rendering, priority handoff, ticker pre-birthday shell, newsletter states, Alive FAB mount, reduced-motion handling, starfield/footer, and no root-homepage replacement.

## Safe changes made in this audit

- Added this audit document.
- Added/updated the timestamped overnight audit work log.
- No runtime prototype code was changed in this pass; the issues found are either documentation drift, visual polish, observability, or require a product decision. This deliberately leaves the later hardening pass a clean baseline.
