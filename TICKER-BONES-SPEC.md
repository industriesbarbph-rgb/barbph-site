# BarbPH Ticker Bones — Locked Interaction Spec

Status: Ticker Bones v2 prototype implemented. It is **not** integrated into the official homepage yet.

## Current panel geometry

- The ticker opens from the top and stops at about **48% of the viewport**, rather than covering the full screen.
- **Testimonials own the top 37.5% of the ticker panel.**
- The remaining **62.5%** is a six-line exchange board.
- Publications and The Bulletin have been removed from Ticker Bones and are now reserved for future Patroller responsibilities.

## Exchange-board identity

The six scrolling rows use a stock-market / terminal visual language rather than cards.

- Primary ticker font: **VT323**.
- Base board background: **black**.
- Supported visual treatments:
  - blue text on black
  - green text on black
  - white text on black
  - black text on white
- Product and Program names are followed by short descriptions inside continuous horizontal streams.
- Rows may move in alternating directions and at slightly different speeds to create a living-market-board effect.
- The prototype uses three Product rows and three Program rows.

## Triangle / pull interaction

- The triangle remains the top-center trigger.
- It self-draws with a luminous trace.
- It performs a small downward tug while closed, creating a visual invitation to pull.
- On open, the triangle rides down with the panel to its lower edge, making the control feel like it physically pulled the board into view.
- Click/tap still toggles the ticker.
- Pull/drag downward still opens it.
- Drag upward while open still closes it.
- Escape closes the ticker and returns focus to the triangle.
- Pointer Events provide the shared mouse/pen/touch gesture path.

## Testimonials

Testimonials remain the calmest portion of the board and sit above the six moving lanes. They retain crossfade support for future live testimonial content.

## Feed policy

The prototype is visual/interaction infrastructure only. Real spreadsheet/feed wiring remains off for now and can be connected later without rebuilding the panel mechanics.

## Accessibility

- Triangle is a real button with an accessible label.
- `aria-expanded` reflects open/closed state.
- Panel exposes `aria-hidden` state.
- Enter/Space toggles the ticker.
- Escape closes and returns focus.
- `prefers-reduced-motion` disables the self-drawing invitation and ticker motion.

## Prototype files

- `/assets/ticker-bones.css`
- `/assets/ticker-bones.js`
- `/ticker-bones-test.html`

The prototype stays `noindex,nofollow` and outside the sitemap.

## Homepage guardrail

Do not create or modify `index.html` merely to test Ticker Bones. Integrate this component only during the official homepage-shell phase.
