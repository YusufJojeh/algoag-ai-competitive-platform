# Playwright E2E, Visual, and i18n Suite

## Scope

This suite covers:

- real landing, login, and assistant runtime flows
- Arabic and English UI execution
- RTL and LTR direction checks
- raw i18n artifact detection
- runtime design-token consistency checks
- deterministic visual regression snapshots for major surfaces and assistant states

## Structure

```text
tests/e2e/
  design/
    design-consistency.spec.ts
  fixtures/
    assistant.ts
    login.ts
  functional/
    assistant-shell.functional.spec.ts
    assistant-states.functional.spec.ts
    landing.functional.spec.ts
    login.functional.spec.ts
  helpers/
    auth.ts
    design.ts
    i18n.ts
    locale.ts
    network.ts
    routes.ts
    visual.ts
  visual/
    assistant-controls.visual.spec.ts
    assistant-history.visual.spec.ts
    assistant-shell.visual.spec.ts
    assistant-states.visual.spec.ts
    landing.visual.spec.ts
    login.visual.spec.ts
```

## Local Run

1. Install browsers:
   `npm run playwright:install`
2. Start Laravel and Vite, or let Playwright start them automatically:
   `npm run test:e2e`
3. Run only visual coverage:
   `npm run test:e2e:visual`

If you already have the dev servers running locally, set:

`PLAYWRIGHT_SKIP_WEBSERVER=1`

Then run:

`npm run test:e2e`

## CI Run

Recommended order:

1. `composer install --no-interaction --prefer-dist`
2. `npm ci`
3. `php artisan key:generate --force`
4. `php artisan migrate --force`
5. `npm run playwright:install`
6. `npm run test:e2e`

The suite provisions a deterministic E2E login fixture through the local/testing-only runtime route `__e2e/runtime/auth/fixture`.

## Snapshot Updates

Update snapshots only after reviewing the intentional UI change:

`npm run test:e2e:update`

For visual-only updates:

`npm run test:e2e:visual:update`

The visual scripts run with `--workers=1` by default in this repository because the heavier assistant snapshot groups have shown timeout-only failures under parallel execution on this environment. This keeps rebuilds deterministic instead of mixing real regressions with worker saturation.

Never bulk-update snapshots without checking:

- locale-specific copy changes
- RTL/LTR direction changes
- button, border, and surface color drift
- assistant empty/error/completed/history states

## Notes

- `ui_locale=ar|en` drives runtime locale for tested surfaces.
- The HTML root `dir` is now locale-aware, so direction assertions are runtime, not mocked.
- Design consistency checks read the real `--app-*` CSS variables from the DOM and compare authenticated surfaces against them.
