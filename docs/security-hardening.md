# Security Hardening

This document describes the security mitigations actually implemented in the codebase. Each section names the file paths and config flags involved.

## 1. Admin mass-assignment fix

**Risk:** If `is_admin` were in `User::$fillable`, any controller that passed request data through `User::create($request->all())` or `$user->fill($request->all())` would let an attacker self-elevate to admin.

**Fix:**
- `app/Models/User.php` — `is_admin` removed from `$fillable`.
- `database/seeders/DatabaseSeeder.php` and `app/Http/Controllers/E2ERuntimeController.php` — explicitly set `is_admin` via direct attribute assignment (`$user->is_admin = true; $user->save();`) which bypasses mass assignment protection because it's a trusted server-side path.

**Tests:** `tests/Feature/SecurityHardeningTest.php`:
- `test_is_admin_is_not_in_user_fillable`
- `test_user_create_cannot_set_is_admin`
- `test_registration_endpoint_cannot_elevate_to_admin`

## 2. E2E fixture endpoint protection

**Risk:** `/__e2e/runtime/auth/fixture` returns valid credentials in plain JSON; `/__e2e/runtime/auth/login` creates and logs in an admin user. Both were originally gated only by `app()->environment(['local', 'testing'])`.

**Fix:** Quadruple gate enforced by `app/Http/Middleware/EnsureE2EFixturesEnabled.php`:
1. `app()->environment(['local', 'testing'])`
2. `config('e2e.enabled') === true` (env: `ENABLE_E2E_FIXTURES=true`)
3. Request includes header `X-E2E-Secret`
4. Header value matches `config('e2e.fixture_secret')` (env: `E2E_FIXTURE_SECRET`), compared with `hash_equals` for timing safety.

If any condition fails, the middleware returns **404** (not 403) so an external probe cannot distinguish "denied" from "route does not exist."

**Files:**
- `config/e2e.php` — config layer
- `app/Http/Middleware/EnsureE2EFixturesEnabled.php` — middleware
- `bootstrap/app.php` — alias registration (`e2e.fixtures`)
- `routes/web.php` — applies `e2e.fixtures` to the runtime route group
- `tests/e2e/helpers/auth.ts` — Playwright helper sends `X-E2E-Secret` header

**Defaults:** `.env.example` ships `ENABLE_E2E_FIXTURES=false` and `E2E_FIXTURE_SECRET=` (empty), so production deployments cannot accidentally expose these routes.

**Tests:** `tests/Feature/E2EFixtureGateTest.php` — covers all four failure modes (production env, flag off, missing header, wrong header, empty secret) plus the success path.

## 3. Safe code-judge defaults + production guard

**Risk:** `LocalProcessJudge` writes AI-generated Python code to a temp file and executes it via `Symfony\Component\Process` with no sandboxing, network restriction, or memory cap. Generated code can read env vars, access the filesystem, and make network calls.

**Fix:**
- `.env.example` now ships `JUDGE_USE_REAL=false` (was `true`). Default behavior uses `StubCodeJudge`, which never executes user code.
- `config/judge.php` adds `sandbox_driver` and `allow_unsandboxed_in_production` config keys.
- `app/Providers/AppServiceProvider.php` — `CodeJudge` is now bound via a lazy closure. When resolved with `JUDGE_USE_REAL=true` in a `production` environment, it throws a clear `RuntimeException` unless either:
  - `JUDGE_SANDBOX_DRIVER` is set (e.g. `docker`, `gvisor`, `firejail`), OR
  - `JUDGE_ALLOW_UNSANDBOXED_IN_PROD=true` is explicitly set to acknowledge the risk

**Remaining risk:** This guard prevents *accidental* exposure but does not actually implement a sandbox. **Real production deployment of the judge still requires implementing one of the sandbox drivers** (Docker container with `--network=none --cap-drop ALL`, gVisor, Firecracker, or similar). The codebase intentionally surfaces this requirement at boot time rather than allowing silent risk.

**Tests:** `tests/Feature/JudgeProductionGuardTest.php` — covers production-block, sandbox-driver-allows, explicit-override-allows, local-env-allows, and default-stub paths.

## 4. Prompt injection mitigation

**Risk:** User-supplied problem text (up to 50,000 characters) was concatenated directly into Ollama prompts across all 5 stages of the Codeforces pipeline. An attacker could inject `\n\nIgnore previous instructions...` to manipulate AI behavior.

**Fix:** `app/Services/CodeforcesSolverService.php` — all 5 prompt builders (`parseProblem`, `generateSolution`, `generateExplanation`, `generateTests`, `generateAlgorithmBreakdown`) wrap user/AI-generated content in explicit XML-style delimiters:

```
<user_content>
{problem text}
</user_content>

<solution_code>
{code}
</solution_code>
```

This mirrors the standard defense recommended by Anthropic and OpenAI: LLMs respect delimited blocks far more reliably than positional cues, making injection attempts much harder to chain through the pipeline.

**Test:** `tests/Feature/SecurityHardeningTest.php::test_codeforces_solver_wraps_user_content_in_delimiters`

## 5. Sanitized error messages

**Risk:** Raw exception messages (containing internal paths, DB connection strings, SQL state codes, internal IPs) were stored in `codeforces_solutions.error_message` and rendered in the frontend `CodeforcesResult` page.

**Fix:**
- `app/Jobs/ProcessCodeforcesSolutionJob::failed()` — stores a fixed generic Arabic message; logs the full exception + stack trace server-side only.
- `app/Services/Assistant/AnalysisService.php` — frame-not-found error no longer includes the file path; broader catch already uses `USER_VISIBLE_FAILURE` constant in non-testing environments.

**Test:** `tests/Feature/SecurityHardeningTest.php::test_job_failed_stores_generic_error_not_exception_message`

## 6. Benchmark size DoS prevention

**Risk:** `BenchmarkRunner::run(string $key, int $size)` had no upper bound on `$size`. A direct caller could trigger memory exhaustion with `size=PHP_INT_MAX`.

**Fix:** `app/Services/BenchmarkRunner.php` — added `MAX_SINGLE_RUN_SIZE = 10_000` and the `run()` method now applies `max(1, min($size, self::MAX_SINGLE_RUN_SIZE))` before generating data. The HTTP path was already safe because `runAll()` hardcodes `DEFAULT_RUN_ALL_SIZE = 1000`, but defense-in-depth covers direct internal callers.

**Tests:** `tests/Feature/SecurityHardeningTest.php`:
- `test_benchmark_runner_max_size_constant_exists`
- `test_benchmark_runner_clamps_oversized_request`
- `test_benchmark_runner_clamps_negative_size_to_one`
- `test_benchmark_runner_zero_size_clamped_to_one`

## 7. Storage path prefix validation

**Risk:** `AnalysisService` reads `frame_path` and `audio_path` from the DB and passes them to `Storage::disk('local')->path(...)`. If those fields were ever tampered with (admin panel, SQL injection elsewhere, race), the path could escape the expected directory.

**Fix:** `app/Services/Assistant/AnalysisService::assertSafeStoragePath()` — validates every DB-stored path starts with the expected prefix (`private/assistant-frames/` or `private/assistant-audio/`). Throws `RuntimeException('Unsafe storage path rejected.')` on violation. No internal path is included in the exception message.

**Tests:** `tests/Feature/SecurityHardeningTest.php`:
- `test_analysis_service_rejects_traversal_in_frame_path`
- `test_analysis_service_rejects_absolute_path_injection`
- `test_analysis_service_accepts_valid_frame_path`
- `test_analysis_service_accepts_valid_audio_path`

## 8. Unpredictable temp directory naming

**Risk:** `LocalProcessJudge::createTempDir()` used `uniqid('', true)`, which is based on microtime. On shared hosts, the directory name could be predicted by an attacker who knows roughly when the judge ran, enabling race-condition file replacement before execution.

**Fix:** `app/Modules/Execution/Judges/LocalProcessJudge::createTempDir()` — now uses `bin2hex(random_bytes(16))`, producing 32 hex characters of cryptographic randomness. The cleanup is also now properly recursive (handles `__pycache__` and other Python artifacts) and logs failures with `Log::warning` rather than swallowing them with `@`.

## 9. Database integrity: missing indexes

**Risk:** Foreign-key columns had no indexes, causing full table scans on every user-scoped query.

**Fix:** Migration `database/migrations/2026_05_11_151923_add_security_hardening_indexes.php` adds indexes on:
- `algorithm_sessions.user_id`
- `codeforces_solutions.user_id`, `codeforces_solutions.status`
- `assistant_sessions.user_id`
- `assistant_messages.session_id`, `status`, `client_request_id`
- `submissions.user_id`, `submissions.problem_id`

## Summary of remaining risks (not addressed in this hardening pass)

The Phase 1 audit also surfaced these risks that are **explicitly out of scope** for the hardening sprint and remain as known issues:

- **Real sandboxing of the Python judge** — guard exists, sandbox driver does not. Implementing Docker/gVisor isolation is the next major security task.
- **Submission flow is a non-functional stub** (`SubmissionController::store()` returns `verdict='stub_reviewed'` without executing code).
- **C++ support advertised in Codeforces UI but not implemented in judge** — judge supports Python only.
- **MIME re-validation on uploaded files** — current validation trusts the client-declared MIME type via `image/*` rule.
- **No SAST / dependency scanning in CI.**
