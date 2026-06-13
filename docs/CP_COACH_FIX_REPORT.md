# CP Coach Fix Report

## Executive verdict

Ready for review and selective commit for the CP Coach assistant scope. The required verification gates pass after the fixes below:

- `npm run build`
- `npm run test`
- `php artisan content:validate`
- `php artisan test`
- `npx playwright test`

Do not commit the whole worktree blindly. The repository still contains unrelated dirty and untracked files that predate or sit outside the mode-selector acceptance work, including AI production-readiness files, storage app artifacts, generated document assets, and broader page changes.

## What was fixed

- Replaced the crowded assistant mode button grid with one accessible native dropdown in `resources/js/components/assistant/QuickModesBar.tsx`.
- Removed header shortcut mode buttons from `resources/js/components/assistant/WorkspaceHeader.tsx` so mode selection is no longer split across controls.
- Added grouped AR/EN metadata for every requested assistant mode in `resources/js/lib/assistant-workspace.tsx`.
- Added `next_step` as a frontend mode alias and backend prompt alias.
- Verified all required modes through frontend selector, request mode value, route validation, prompt orchestration, and rendered response contract.
- Added `docs/CP_COACH_MODE_WIRING_MATRIX.md` with the mode-by-mode wiring matrix.
- Fixed Playwright startup/teardown by replacing the hanging built-in `webServer` config with explicit global setup/teardown scripts.
- Set Playwright to one worker because the local E2E stack uses a single PHP built-in server.
- Updated functional and visual E2E coverage for the dropdown selector and responsive shell.
- Hardened `LocalProcessJudge` timeout handling so infinite Python submissions terminate reliably on Windows/PHP instead of hanging the PHP test suite.
- Cleaned only test-generated TTS files under `storage/framework/testing/disks/local/private/assistant-tts`.

## Mode wiring status

All requested modes are documented as working/fixed in `docs/CP_COACH_MODE_WIRING_MATRIX.md`:

Topic, Recommend, Hint, Check, Critique, Edge cases, Complexity, Full solve, Step by step, Compare, Mistakes, Solve, Code, Tests, Verify, Debug WA, Wrong answer, Summarize, Next step.

Backend coverage: `tests/Unit/PromptOrchestratorTest.php`.
Frontend coverage: `resources/js/Pages/Assistant.test.jsx`.
Runtime E2E coverage: `tests/e2e/functional/assistant-shell.functional.spec.ts`.
Visual mode coverage: `tests/e2e/visual/assistant-controls.visual.spec.ts`.

## UX changes

- Primary modes are first in the dropdown: Hint, Check, Debug WA, Complexity, Edge cases.
- Secondary/advanced modes are grouped into learning, solving, verification, and aliases.
- Selected mode is visible in the select plus a descriptive panel below it.
- AR/EN labels and descriptions are supplied from the same metadata source.
- RTL/LTR behavior is covered by functional and visual E2E tests across desktop, laptop, tablet, and mobile.
- Empty/loading/error/history visual states remain covered by visual snapshots.

## Tests run

- `npm run build` passed.
- `npm run test` passed: 107 tests.
- `php artisan content:validate` passed.
- `php artisan test` passed: 302 passed, 1 skipped.
- `npx playwright test tests/e2e/functional tests/e2e/design` passed: 88 passed.
- `npx playwright test tests/e2e/visual` passed: 156 passed, 148 skipped.
- `npx playwright test` passed: 244 passed, 148 skipped.

The skipped Playwright tests are spec-defined responsive skips, mainly for visual cases that intentionally run only on appropriate viewport classes.

## Screenshots and snapshots

Updated visual evidence is stored under:

- `tests/e2e/__snapshots__/desktop-1440/visual/assistant-controls.visual.spec.ts/`
- `tests/e2e/__snapshots__/laptop-1280/visual/assistant-controls.visual.spec.ts/`
- `tests/e2e/__snapshots__/desktop-1440/visual/assistant-shell.visual.spec.ts/`
- `tests/e2e/__snapshots__/mobile-390/visual/assistant-shell.visual.spec.ts/`
- `tests/e2e/__snapshots__/mobile-390/visual/landing.visual.spec.ts/`

Representative selector snapshots:

- `tests/e2e/__snapshots__/desktop-1440/visual/assistant-controls.visual.spec.ts/assistant-en-mode-dropdown-hint.png`
- `tests/e2e/__snapshots__/desktop-1440/visual/assistant-controls.visual.spec.ts/assistant-ar-mode-dropdown-debug-wrong-answer.png`
- `tests/e2e/__snapshots__/laptop-1280/visual/assistant-controls.visual.spec.ts/assistant-en-mode-dropdown-next-step.png`

## Dirty worktree notes

Before fixes, the worktree already contained many unrelated modified/untracked files, including `.env.example`, AI hardening services/config/migrations, app private assistant audio/frame artifacts, generated docs, and broad frontend page edits.

After fixes:

- Test-generated TTS artifacts in `storage/framework/testing/disks/local/private/assistant-tts` are clean.
- No listener remains on `127.0.0.1:8000` or `127.0.0.1:5174`; only `TIME_WAIT` sockets were observed after Playwright teardown.
- Intended CP Coach/mode work includes the assistant selector/header/lib files, mode prompt aliases, tests, Playwright config/setup, visual snapshots, `LocalProcessJudge`, and the new wiring/report docs.
- Unrelated dirty/untracked files remain and should be reviewed separately before staging.

## Remaining risks

- The worktree is not clean, so deployment should stage only the intended CP Coach acceptance files or first separate unrelated changes.
- E2E runtime is intentionally single-worker because PHP's built-in server is single-process. Raising workers reintroduces timeout/flake risk.
- Some assistant mode labels/descriptions are inline metadata rather than a separate keyed translation catalog; coverage verifies AR/EN presence, but a future localization system should centralize them.

## Ready to commit/deploy

Ready to commit the intended CP Coach fixes after selective staging. Ready to deploy only after excluding or separately accepting the unrelated dirty files and generated private storage artifacts.
