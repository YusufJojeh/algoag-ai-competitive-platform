# Test Report — Phase 2 Hardening

Generated after the Phase 2 hardening sprint (E2E gate, judge production guard, realtime dev scripts, docs).

## Commands run

```bash
composer install            # exit 0
npm install                 # exit 0 (11 advisory vulnerabilities reported, unrelated)
php artisan test            # exit 0
npm run build               # exit 0
```

## Backend tests — PHPUnit

```
Tests: 281 passed (783 assertions), 1 skipped
Duration: ~75 s
```

### Phase 2 — new test files

| File | Tests | Status |
|---|---|---|
| `tests/Feature/E2EFixtureGateTest.php` | 7 | ✅ all pass |
| `tests/Feature/JudgeProductionGuardTest.php` | 6 | ✅ all pass |

### Phase 1 — security regression suite

| File | Tests | Status |
|---|---|---|
| `tests/Feature/SecurityHardeningTest.php` | 16 (15 pass, 1 skipped) | ✅ |

### Skipped test (intentional)

| Test | Reason |
|---|---|
| `SecurityHardeningTest::test_local_process_judge_creates_unpredictable_temp_dir` | Requires `JUDGE_USE_REAL=true`. Default config under PHPUnit uses the safe stub judge. To run this test locally, set `JUDGE_USE_REAL=true` and re-run. |

### All previously existing suites still pass

`AlgorithmAssistantControllerTest`, `AssistantCompletionFlowTest`, `AssistantControllerTest`, `AssistantHardeningTest`, `AuthenticationTest`, `CodeforcesSolveControllerTest`, `ContentIndexCommandTest`, `ContentManifestValidationTest`, `CpProblemRepositoryTest`, `LocalProcessJudgeTest`, `PatternLibraryTest`, `ProblemAdminControllerTest`, plus all Unit tests (`AlgorithmSessionModelTest`, `AppServiceProviderTest`, `AssistantEventsTest`, `BenchmarkRunnerTest`, `BroadcastEnvelopeTest`, `CleanupAssistantTempFilesTest`, `CodeforcesPromptsTest`, `CodeforcesSolutionModelTest`, `CodeforcesSolverServiceTest`, `ControllerTest`, `HandleInertiaRequestsTest`, `OllamaServiceTest`, `OpenAITTSTest`, `OpenAIVisionProviderTest`, `PatternRepositoryTest`, `ProcessAnalysisJobTest`, `PromptOrchestratorTest`, `WhisperSTTTest`).

## Frontend build — Vite

```
✓ built in 5.49s
```

Notable output sizes:

| Bundle | Size | Gzip |
|---|---|---|
| `react.esm` | 442.00 kB | 119.78 kB |
| `app` | 344.12 kB | 112.31 kB |
| `Landing` | 142.39 kB | 46.45 kB |
| `AppLayout` | 135.69 kB | 39.31 kB |
| `Assistant` | 74.81 kB | 22.18 kB |

`Landing` bundle still ships Three.js / React Three Fiber un-lazy-loaded — flagged in Phase 1 audit but **not** in Phase 2 scope.

## Coverage progression

| Phase | PHPUnit pass | Build |
|---|---|---|
| Baseline (before hardening) | 0 — pre-existing MySQL test config bug caused failures on a clean checkout | failed prerequisite |
| Phase 1 (security regression suite) | 268 passed, 0 failed, 1 skipped | clean |
| Phase 2 (E2E gate + judge guard) | **281 passed, 0 failed, 1 skipped** | clean |

Net change: **+13 tests** (7 E2E gate + 6 judge guard), zero regressions.

## Known limitations of this report

- **Playwright E2E tests not exercised.** They require a running Laravel server (`php artisan serve`), Reverb (`php artisan reverb:start`), Vite (`npm run dev`), and a queue worker — i.e. the full `composer run dev` stack. Run separately with `npm run test:e2e` after starting the stack.
- **Vitest frontend tests not re-run in this report** (`npm run test`). They were green at Phase 1 baseline; nothing in Phase 2 touched frontend code other than Inertia progress bar config.
- **Real-judge tests** (`LocalProcessJudgeTest` 9 tests in `tests/Feature/`) run only when Python 3 is on `PATH`. They passed in this run.
- **No SAST / dependency scanning** has been added. `npm audit` reports 11 advisories at install; none are in production runtime paths but should be addressed separately.

## Manual verification steps

The following were verified by code inspection + test assertions but not by manual browser/curl:

| Check | How verified |
|---|---|
| `/__e2e/runtime/auth/fixture` returns 404 without header | `E2EFixtureGateTest::test_returns_404_when_header_missing` |
| Same, when `ENABLE_E2E_FIXTURES=false` | `test_returns_404_when_flag_disabled` |
| Same, when `APP_ENV=production` | `test_returns_404_when_environment_is_production` |
| `CodeJudge` throws clear exception in production without sandbox | `JudgeProductionGuardTest::test_production_with_use_real_and_no_sandbox_throws` |
| `CodeJudge` resolves to `StubCodeJudge` by default | `test_use_real_false_always_resolves_to_stub` + `test_default_config_resolves_to_stub` |

## Reproduction

To reproduce this report from a fresh checkout:

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan test
npm run build
```

Or shorter:

```bash
composer run setup    # full setup
composer run verify   # test + build
```
