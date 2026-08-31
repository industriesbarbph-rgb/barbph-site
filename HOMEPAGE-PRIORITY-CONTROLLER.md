# BarbPH Homepage Priority Controller

Current reconciliation: **2026-08-31 (Manila)**

Status: integrated into the current homepage architecture through `netlify/functions/homepage-priority.mjs`.

## Locked priority

1. Sponsor Takeover
2. Theme Override
3. Daily Discover

The controller uses `Asia/Manila` for scheduling decisions.

## Sponsor Takeovers

A sponsor can win only when its Admin Sheet row is approved, inside the active date window, has a brand name, uses an allowed image/video media type, has a valid HTTPS media URL, and has a valid HTTPS overlay link when one is supplied.

If multiple valid approved sponsors overlap, the first valid row in Sheet order wins and conflict count is reported diagnostically.

## Theme Override

A Theme Override can win only when no valid sponsor wins, `override_active=yes`, a theme name exists, and the Manila date is inside the configured window.

If multiple valid overrides overlap, the first valid row in Sheet order wins and the conflict is reported diagnostically.

## Daily Discover handoff

When neither higher-priority mode wins, the controller returns `selected_mode: daily_discover` and points to:

`/.netlify/functions/daily-stream-public`

That endpoint is the current public wrapper for the continuous source-of-the-day engine.

## Failure behavior

If the Sponsor Takeovers or Theme Override control sheet cannot be read, the controller returns `CONTROL_UNAVAILABLE` rather than silently ignoring a higher-priority obligation.

## Diagnostic mode

`homepage-priority-test.html` remains an internal `noindex,nofollow` test surface. Synthetic sponsor/theme/daily modes do not write spreadsheet controls or production source state.
