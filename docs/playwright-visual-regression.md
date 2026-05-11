# Playwright Visual Regression

## What this covers

This setup provides deterministic Playwright visual regression coverage for:

- landing page layouts
- login page states
- assistant shell layout
- assistant visual states
- quick mode rendering in RTL
- long conversation / history-style thread snapshots

The suite uses dedicated local/testing-only Inertia routes under `__e2e/visual/*` so snapshots do not depend on:

- real authentication
- WebSocket availability
- live AI provider responses
- browser screen-capture prompts
- realtime timestamps
- unstable animation timing

## Snapshot strategy

- Browser: Chromium only for visual baselines
- Viewports:
  - `desktop-1440`
  - `laptop-1280`
  - `tablet-768`
  - `mobile-390`
- Reduced motion is enabled globally
- Animations and transitions are disabled again at runtime before snapshots
- Date and `Math.random()` are frozen in the browser context
- Assistant states are seeded from deterministic frontend fixtures
- Landing snapshots force the static hero fallback instead of live WebGL rendering

## Updating snapshots intentionally

Only update snapshots when:

- the visual change is deliberate
- spacing / RTL / alignment changes were reviewed
- the affected viewport set was checked, not just one width

Update command:

```bash
npm run test:e2e:visual:update
```

Review the changed images before committing.

## CI notes

- Install Chromium once with:

```bash
npm run playwright:install
```

- Run the suite with:

```bash
npm run test:e2e:visual
```

- HTML output is written to `playwright-report/`.

## Masking guidance

Current seeded routes intentionally avoid most unstable regions, so masking is not used by default.

If a future page contains unavoidable volatility, only mask:

- live clocks
- non-deterministic canvas/WebGL surfaces
- externally sourced avatars or images

Do not mask:

- layout containers
- cards
- text alignment
- sidebar spacing
- composer controls
- assistant thread content

Those are the exact surfaces this suite is supposed to protect.
