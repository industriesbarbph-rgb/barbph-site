# BarbPH Alive FAB — Locked Interaction Spec

Status: functional shell implemented as a standalone prototype. Not yet integrated into the official homepage.

## Locked behavior

- The main FAB is a round, inviting, wordless object fixed at the bottom-right.
- No visible words appear on the closed main FAB.
- Clicking or tapping the main FAB fans out three separate destination buttons.
- The words `Products`, `Programs`, and `Partnerships` become visible only after their respective buttons fan out.
- Closing the fan returns the interface to the single wordless orb.

## 3P destinations

1. Products — active and routes to `/products`.
2. Programs — active and routes to `/programs`.
3. Partnerships — visible in the fan, but inactive until the real Partnerships page exists.

When Partnerships is ready, the component can activate it by assigning its real URL; no interaction redesign is required.

## Patroller relationship

The FAB itself should not explain itself with visible instructional copy on the homepage.

Future Patroller behavior may tell a visitor that the round object at the bottom-right opens the three Ps: Products, Programs, and Partnerships.

The component exposes a `nudge()` hook so Patroller can draw attention to the FAB visually without opening it automatically or adding permanent text.

## Accessibility

- The wordless main button has an accessible label for screen readers.
- It exposes menu-expanded state with `aria-expanded`.
- Escape closes the fan and returns focus to the main button.
- Clicking outside closes the fan.
- Products and Programs are keyboard reachable while open.
- Partnerships remains removed from keyboard navigation while inactive.
- Reduced-motion preferences disable the breathing/nudge animation.

## Prototype files

- `/assets/alive-fab.css`
- `/assets/alive-fab.js`
- `/alive-fab-test.html`

The prototype page is diagnostic-only and must remain `noindex,nofollow` and outside the sitemap.

## Visual status

The current orb is a functional visual prototype, not the locked final skin. Final material, glow, exact size, depth, and motion can still be refined when the official homepage is assembled.

## Homepage guardrail

Do not create or modify `index.html` merely to test the FAB. Integrate this component into the homepage only when the official homepage shell phase begins.
