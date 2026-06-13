# CP Coach Acceptance Audit

Date: 2026-05-28
Scope: QA-only audit of the CP Coach AI UX + landing upgrade in the current worktree.

## Executive Verdict

Request changes before commit or deploy.

The upgraded landing page and assistant workspace render as a credible competitive-programming coach in manual desktop, tablet, and mobile checks. Arabic/English direction switching works in the inspected screens, the main CP assistant modes are visible, and the main non-Playwright gates pass.

The acceptance gate is not production-ready because the full Playwright suite does not pass, the worktree mixes the intended CP UX changes with unrelated backend/config/storage changes, and the E2E runtime setup is unstable under the requested command. The UI may be directionally good, but the current repository state is not clean enough to commit or deploy as one change.

## Verification Commands

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run build` | Pass | Vite build completed successfully. |
| `npm run test` | Pass | 11 files, 112 frontend tests passed. |
| `php artisan content:validate` | Pass | Content manifests reported valid. |
| `php artisan test` | Pass | 288 passed, 1 expected skip, 801 assertions. |
| `npx playwright test` | Fail | Exact command timed out waiting for configured webServer after 120000 ms. |
| `PLAYWRIGHT_SKIP_WEBSERVER=1 npx playwright test` against a manually started server | Fail | 296 total: 64 passed, 132 failed, 100 skipped. Major failures are stale/changed visual snapshots and runtime 500s from MySQL-backed cache/session paths in the local environment. |

## What Is Truly Production-Ready

- The production frontend bundle builds successfully.
- Frontend unit coverage for Assistant, Codeforces solve/result, Suggestions, Results, hooks, and Inertia boot passes.
- Backend unit/feature coverage for assistant hardening, Codeforces solving, algorithm suggestions/benchmarking, auth, content, local judge, and security hardening passes.
- Content manifests are valid.
- Manual visual evidence confirms the upgraded landing has visible AR/EN CP-coach positioning, CTAs, dark UI contrast, and below-fold sections.
- Manual visual evidence confirms the assistant shell shows CP modes, context panel, composer, status/failure states, RTL/LTR direction, and dark readable surfaces.
- The backend/frontend mode contract includes hint, complexity, edge cases, verify code, wrong-answer debugging, summarize/step-by-step, and full solution modes.

## Bugs Or Weak Areas

1. Full Playwright acceptance is failing.
   - Exact `npx playwright test` cannot pass as requested because the configured webServer did not become ready in 120 seconds.
   - A rerun with verified servers and `PLAYWRIGHT_SKIP_WEBSERVER=1` still failed 132 tests.
   - Many visual failures are expected after the redesign because snapshots were not updated, but they still block acceptance.

2. Runtime E2E environment is unstable.
   - Several runtime tests hit a Laravel 500 caused by `SQLSTATE[HY000] [2002]` against local MySQL `algoa` while the test server should be isolated from local MySQL.
   - This affects landing/login runtime tests and auth fixture flows.
   - Required before deploy: make the Playwright webServer consistently use test-safe cache/session/database settings.

3. Worktree is not clean or isolated.
   - Intended CP UX files are mixed with unrelated AI hardening, config, migrations, generated documents, private assistant audio/frame files, and test-storage artifacts.
   - Test execution also left tracked assistant TTS fixture deletions plus new untracked TTS files under `storage/framework/testing`.
   - Required before commit: split or stage only intentional files, remove generated private storage, and restore or intentionally commit test fixture artifacts.

4. Accessibility gaps remain.
   - `resources/js/components/context/ContextPanelHeader.tsx` has icon-only buttons without accessible names.
   - `resources/js/components/assistant/TranscriptComposer.tsx` relies on placeholder text for the main textarea instead of a durable visible or sr-only label.
   - Button focus styling exists globally, but not every custom interactive surface has an explicit accessible name.

5. Translation architecture is mostly inline conditionals, not a keyed translation system.
   - The inspected rendered AR/EN landing and assistant screens did not show mojibake or raw translation artifacts.
   - There are still hardcoded user-facing strings in legacy or secondary components such as `resources/js/Pages/Home.jsx`, `resources/js/components/AssistantChat.jsx`, `resources/js/components/QuickActions.jsx`, and admin pages.
   - Some of these may be dead or low-traffic paths, but the claim "no hardcoded user-facing text" is not true for the repository.

6. Assistant mode test coverage is incomplete.
   - Runtime UI shows many modes: topic, recommend, hint, check, critique, edge cases, complexity, full solve, step by step, compare, mistakes, solve, code, tests, verify, and debug WA.
   - E2E quick-mode fixtures only cover `hint`, `check`, `wrong`, `full`, `summarize`, `edge_cases`, and `complexity`.
   - `verify_code`, `debug_wrong_answer`, and canonical `step_by_step_solution` are not directly covered as first-class E2E scenarios.

7. Landing console has a minor asset issue.
   - Manual desktop landing capture logged one 404 resource error. It did not block rendering, but it should be identified and fixed before deploy.

## Missing Scenarios

- Full Playwright pass with webServer managed by `playwright.config.ts`.
- Approved visual snapshot update for the new landing and assistant layouts.
- E2E runtime coverage for Suggestions and Results pages after their AppLayout migration.
- E2E coverage for `verify_code`, `debug_wrong_answer`, `step_by_step_solution`/next step, and `full_solution` using canonical backend mode names.
- Keyboard-only flow through quick modes, composer, context panel tabs, and icon buttons.
- Screen-reader names for all icon-only controls.
- Error state coverage for failed Ollama suggestions, failed benchmark recommendation, and Codeforces solve polling failure in both locales.
- Authenticated public-to-assistant journey under a stable test database/cache configuration.

## Files Changed

### Intended CP UX / Landing / Frontend Test Surface

- `docs/cp-coach-ai-ux-upgrade-plan.md`
- `resources/js/Pages/Landing.tsx`
- `resources/js/Pages/Suggestions.jsx`
- `resources/js/Pages/Results.jsx`
- `resources/js/Pages/CodeforcesSolve.jsx`
- `resources/js/Pages/CodeforcesResult.jsx`
- `resources/js/Pages/Suggestions.test.jsx`
- `resources/js/Pages/Results.test.jsx`
- `resources/js/Pages/CodeforcesSolve.test.jsx`
- `resources/js/components/assistant/MessageCard.tsx`
- `resources/js/components/context/AudioReplyPlayer.tsx`
- `resources/js/components/context/ContextPanelHeader.tsx`
- `resources/js/components/context/LiveCapturePreview.tsx`
- `resources/js/components/context/StatusTimeline.tsx`
- `resources/js/components/landing/FeatureGrid.tsx`
- `resources/js/components/landing/FinalCTA.tsx`
- `resources/js/components/landing/HeroSection.tsx`
- `resources/js/components/landing/HowItWorksTimeline.tsx`
- `resources/js/components/landing/MotionReveal.tsx`
- `resources/js/components/landing/TrustSection.tsx`
- `resources/js/components/landing/VoiceVisionShowcase.tsx`
- `resources/js/components/ui/tabs.tsx`
- `resources/js/components/ui/textarea.tsx`

### Related But Not Pure UX

- `resources/js/Pages/Assistant.tsx`
- `resources/js/Pages/Auth/Login.tsx`
- `resources/js/Pages/Problems/Show.jsx`
- `resources/js/app.jsx`
- `resources/js/hooks/useAssistantStream.js`
- `tests/Unit/PromptOrchestratorTest.php`

### Unrelated Or Needs Separate Review

- `.env.example`
- `app/Http/Controllers/*`
- `app/Jobs/*`
- `app/Models/CodeforcesSolution.php`
- `app/Modules/*`
- `app/Providers/AppServiceProvider.php`
- `app/Services/*`
- `routes/console.php`
- `app/Console/Commands/MarkStaleAiJobs.php`
- `app/Exceptions/*`
- `app/Models/AiUsageRecord.php`
- `config/ai.php`
- `database/migrations/2026_05_21_*.php`
- `docs/ai-production-readiness.md`
- generated `.docx`/rendered documentation files
- generated `storage/app/private/private/assistant-*` files
- generated or deleted `storage/framework/testing/disks/local/private/assistant-tts/*` files

## Route, Page, Component, And Data Contract Notes

- Public routes include `/`, `/patterns`, `/patterns/{pattern}`, auth routes, and E2E visual/runtime routes.
- Auth routes include `/assistant`, assistant session/message APIs, `/suggest`, `/benchmark`, `/solve`, `/solve/result/{id}`, problems, courses, submissions, and admin problem CRUD.
- `Suggestions.jsx` expects `problem`, `suggestions`, and `ollamaAvailable`.
- `Results.jsx` expects `problem`, `suggestions`, `benchmarkResults`, `recommendation`, and `sessionId`.
- `CodeforcesSolve.jsx` expects `ollamaAvailable`, `recentSolutions`, and form errors.
- `CodeforcesResult.jsx` expects `solution`, status/progress fields, parsed problem, tests, run results, code, explanation, and algorithm breakdown.
- No backend contract mismatch was found in unit/backend tests, but E2E runtime failures prevent full confidence in route-level production readiness.

## Screenshot Evidence

Screenshots were captured outside the repository at:

- `C:\Users\Yusuf\AppData\Local\Temp\cp-coach-acceptance-audit\landing-en-desktop.png`
- `C:\Users\Yusuf\AppData\Local\Temp\cp-coach-acceptance-audit\landing-ar-tablet.png`
- `C:\Users\Yusuf\AppData\Local\Temp\cp-coach-acceptance-audit\landing-en-mobile.png`
- `C:\Users\Yusuf\AppData\Local\Temp\cp-coach-acceptance-audit\assistant-en-desktop.png`
- `C:\Users\Yusuf\AppData\Local\Temp\cp-coach-acceptance-audit\assistant-ar-tablet.png`
- `C:\Users\Yusuf\AppData\Local\Temp\cp-coach-acceptance-audit\assistant-en-mobile.png`

Observed screenshot facts:

- Landing EN desktop: hero, experience, features, how-it-works, trust, and CTA all visible; dark contrast is readable; full page height is 3159px.
- Landing AR tablet: RTL direction is correct; Arabic copy is readable; below-fold content renders through CTA/footer; full page height is 3891px.
- Landing EN mobile: all landing sections are present and stacked; full page height is 5737px.
- Assistant EN desktop: all CP modes are visible, including Verify and Debug WA; context panel and composer render with readable dark contrast.
- Assistant AR tablet: failed/error state renders in RTL with visible alert, composer error, and context panel.
- Assistant EN mobile: history state renders on a narrow viewport with modes, conversation, composer, and context panel available.

## Test Coverage Assessment

- Strong: backend behavior, provider safety, content validation, Codeforces controller/service behavior, assistant endpoint ownership/idempotency, frontend unit tests for major pages.
- Moderate: AR/EN rendering is covered by E2E helpers and manual screenshots, but full E2E currently fails.
- Weak: visual snapshots are stale after the redesign; Suggestions/Results do not have E2E coverage; canonical verify/debug/step-by-step modes are not directly exercised as E2E mode cases.
- Blocking: `npx playwright test` must pass before the upgrade can be accepted.

## Risk Level

High for deploy or merge as-is.

The user-facing UI direction is good, but failing Playwright, mixed unrelated changes, test artifact churn, and accessibility gaps make this unsuitable for production release without cleanup and targeted fixes.

## Required Fixes Before Commit Or Deploy

1. Make `npx playwright test` pass from a clean shell without manual server setup.
2. Fix Playwright server env isolation so tests do not use local MySQL/cache state.
3. Review and approve the new visual design, then update visual snapshots intentionally.
4. Split intended CP UX changes from unrelated backend/config/migration/document/storage changes.
5. Remove generated private assistant audio/frame artifacts from the worktree.
6. Restore or intentionally handle tracked test TTS fixture changes.
7. Add accessible names to icon-only context panel buttons.
8. Add a proper accessible label for the assistant composer textarea.
9. Add E2E coverage for Suggestions, Results, Verify code, Debug WA, and canonical next-step/step-by-step mode.
10. Fix the landing desktop 404 resource warning.

