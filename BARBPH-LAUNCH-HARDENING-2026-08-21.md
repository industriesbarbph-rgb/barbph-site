# BarbPH Launch Prototype Hardening — 2026-08-21

Scope: prototype and shared prototype assets only. `index.html`, Products, Programs, spreadsheet permissions, Daily Discover source arming, sponsor settings, and the root-homepage launch state were not changed.

## Changes completed

### Launch prototype loading and graceful fallback

- `homepage-launch-test.html` now preloads Daily Discover image candidates before they are admitted into the visual rotation.
- Unloadable Daily Discover images are dropped from the rotation instead of producing a visually blank slot.
- If every Daily Discover image candidate fails to load, the existing visual-unavailable fail state is used.
- Sponsor mode now keeps the approved generic visual fallback behind sponsor media. A failed sponsor video removes itself and leaves the fallback visible rather than leaving an empty world.
- Asset-rotation timers are explicitly cleared/reset during mode changes and error handling.

### Newsletter resilience

- Newsletter email input is trimmed before validation/submission.
- Newsletter submission now has a 12-second abort timeout so a stalled network request cannot leave the Join button indefinitely disabled.
- Timeout failures receive a specific retry message.
- Error feedback is promoted to `role="alert"`; normal/success feedback remains polite status output.
- The Join button is restored in `finally` on all success/failure paths.

### Ticker pre-birthday interaction hardening

- Pointer capture/release is guarded so unsupported or interrupted pointer APIs do not strand the drag state.
- Drag state is cancelled on pointer-capture loss, window blur, resize, orientation change, document hiding, and page hide.
- Focus calls have compatibility fallbacks.
- Existing click/drag thresholds, Escape behavior, `aria-expanded`, `aria-hidden`/`inert`, and body scroll lock remain intact.

### Alive FAB accessibility hardening

- The wordless main button now explicitly controls the menu through `aria-controls`.
- Focus movement uses a safe compatibility helper.
- Open/close events only fire on real state transitions rather than no-op state assignments.
- The fan closes when keyboard focus leaves the component, preventing an abandoned open menu.
- Escape reliably prevents default behavior, closes the fan, and returns focus to the main button.
- Partnerships remains visible but inactive; Products and Programs remain active and unchanged.

## Verification performed

- Reviewed the preceding prototype audit and preserved every guardrail it identified.
- Reviewed GitHub diffs for the Ticker, Alive FAB, and homepage prototype commits to confirm changes were isolated to `assets/ticker-bones.js`, `assets/alive-fab.js`, and `homepage-launch-test.html`.
- Confirmed Netlify produced a ready production-context deploy for the shared asset hardening with all 11 existing functions still present and no function deployment errors.
- Confirmed no Daily Discover function/source-arm, sponsor-control, spreadsheet-permission, Products, Programs, or `index.html` change was included in the hardening commits.

## Remaining risks / intentionally unresolved

- Footer clock timezone/location labeling remains a product decision; this pass did not change its visitor-local semantics.
- The decorative footer globe remains a prototype placeholder and is not launch-locked artwork.
- Priority-controller sheet readability remains a fail-closed availability dependency; changing that policy was outside this pass.
- Same-URL browser edge caching can still make `cache_hit:false` appear stale for diagnostics; persisted daily-lock verification should continue to use an uncached/separate request.
- A full browser-device matrix (real iOS Safari / Android Chrome / desktop Safari) was not available inside this automated run; the code was hardened against the principal focus, pointer-interruption, reduced-motion, and responsive failure modes instead.
