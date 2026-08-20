# BarbPH Ticker Bones — Locked Interaction Spec

Status: functional ticker skeleton implemented as a standalone prototype. It is **not** integrated into the official homepage yet.

## Purpose

Build the permanent ticker mechanics now so the real content feeds can be switched on later without rebuilding the triangle, glass panel, gesture system, content zones, or homepage layout.

Full feed activation remains targeted for **around December 2026**.

## Locked trigger

- A **self-drawing triangle** sits at the top center of the future homepage hero.
- The triangle itself carries no visible instructional words.
- Click/tap toggles the ticker for discoverability and accessibility.
- Pull/drag downward opens the ticker.
- When open, dragging upward closes it.
- Escape closes the ticker and returns focus to the triangle.
- Pointer Events provide one gesture path for mouse, pen, and touch.

## Locked panel behavior

- Opens into a **frosted-glass full-screen panel**.
- The panel occupies the full viewport rather than appearing as a card or drawer inside another frame.
- Body scrolling is locked while the panel is open.
- Motion respects `prefers-reduced-motion`.
- The triangle reverses orientation while the panel is open so the same control visually communicates closing.

## Permanent content-zone proportions

The full-screen panel uses three permanent vertical bands:

1. **Top ~1/8 — Testimonials**
   - one item at a time
   - gentle crossfade socket

2. **Middle ~5/8 — Products + Programs**
   - two long horizontal streams
   - opposite movement directions
   - Products moves one way; Programs moves the other

3. **Bottom ~1/4 — Publications + The Bulletin**
   - two permanent sockets
   - gentle crossfade behavior when multiple items exist

These five named zones are permanent:

- Testimonials
- Products
- Programs
- Publications
- The Bulletin

## Current placeholder policy

The prototype uses restrained `Coming soon` placeholders only to prove layout and motion.

The component does **not** fetch production content, read feeds, or activate any December feed system yet.

Empty-zone collapse support is prepared in the component API so future feeds can suppress genuinely empty sockets without changing the core panel.

## Accessibility

- Main triangle is a real button with an accessible label.
- `aria-expanded` reflects open/closed state.
- Panel exposes `aria-hidden` state.
- Enter/Space toggles from the focused triangle.
- Escape closes and returns focus.
- Reduced-motion preferences stop self-drawing and stream motion.
- Mobile and desktop share the same Pointer Events gesture logic.

## Integration hooks

The component exposes:

- `window.BarbTickerBones.open()`
- `window.BarbTickerBones.close()`
- `window.BarbTickerBones.toggle()`
- `window.BarbTickerBones.syncEmptyZones()`
- `window.BarbTickerBones.isOpen`

It also emits bubbling DOM events:

- `barb:ticker-open`
- `barb:ticker-close`

These hooks allow future Patroller/homepage behavior to coordinate with the ticker without rewriting the ticker mechanics.

## Prototype files

- `/assets/ticker-bones.css`
- `/assets/ticker-bones.js`
- `/ticker-bones-test.html`

The prototype page is diagnostic-only and must remain `noindex,nofollow` and outside the sitemap.

## Homepage guardrail

Do not create or modify `index.html` merely to test Ticker Bones. The component should be inserted only when the official homepage shell phase begins.
