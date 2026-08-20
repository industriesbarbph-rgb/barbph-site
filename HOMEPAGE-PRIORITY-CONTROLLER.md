# BarbPH Homepage Priority Controller

Status: implemented as a standalone controller. It does **not** create or replace `index.html`.

## Locked priority
1. Sponsor Takeover
2. Theme Override
3. Daily Discover

The controller uses the Manila date (`Asia/Manila`) for all scheduling decisions.

## Sponsor Takeovers
The controller reads the existing `Sponsor Takeovers` sheet columns:
`brand_name, media_type, media_url, overlay_text, overlay_link, start_date, end_date, status`.

A sponsor can take over only when:
- `status = approved`
- the Manila date is inside the inclusive `start_date` to `end_date` window
- `brand_name` is present
- `media_type` is `image` or `video`
- `media_url` is a valid HTTPS URL
- if `overlay_link` is supplied, it must also be a valid HTTPS URL

Draft, incomplete, malformed, expired, and future sponsor rows do not win the homepage.

If more than one valid approved sponsor overlaps the same date, the first valid row in spreadsheet order wins and the controller reports a conflict count for diagnostics.

## Theme Override
The controller reads the existing `Theme Override` sheet columns:
`override_active, theme_name, start_date, end_date`.

A theme override can win only when:
- no valid sponsor takeover currently wins
- `override_active = yes`
- `theme_name` is present
- the Manila date is inside the inclusive date range

If multiple valid overrides overlap, the first valid row in spreadsheet order wins and the conflict is surfaced diagnostically.

## Daily Discover handoff
When neither a sponsor nor a theme override is valid for the date, the controller returns `selected_mode: daily_discover` and points the future homepage to `/.netlify/functions/daily-discover-production`.

The priority controller does not arm Daily Discover. The production engine remains governed by its own readiness state and spreadsheet controls.

## Failure behavior
If either control sheet cannot be read or its expected header is missing, the controller returns `CONTROL_UNAVAILABLE` instead of silently dropping to a lower-priority experience. This protects sponsor obligations and manual overrides from being accidentally ignored.

## Diagnostic mode
`homepage-priority-test.html` is a noindex lab page. It can:
- read the real spreadsheet controls for a chosen Manila date
- verify that the existing example sponsor remains rejected while its status is `draft`
- run synthetic sponsor, theme, and Daily Discover priority tests without writing anything

Lab query parameters are accepted only with `lab=1`. Synthetic mock modes never write to the spreadsheet and never modify production controls.
