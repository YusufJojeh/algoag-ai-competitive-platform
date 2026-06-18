# ALGOAG Testing Report

Date: 2026-06-19

## Latest Verified Results

These results are from the final release-preparation run on the local Windows/XAMPP workspace.

| Gate | Result | Notes |
| --- | --- | --- |
| `php artisan optimize:clear` | PASS | Laravel caches cleared. |
| `php artisan route:list` | PASS | Routes render successfully. |
| `php artisan schedule:list` | PASS | Scheduler includes assistant cleanup, stale AI job marking, and Arena publishing. |
| `php artisan test` | PASS | Full backend suite passed in the latest run. |
| `npm run test` | PASS | Full Vitest suite passed in the latest run. |
| `npm run build` | PASS | Production frontend build completed. |
| `npm run lint` | PASS | TypeScript `tsc --noEmit` completed. |
| `php artisan migrate` with SQLite in-memory test env | PASS | Safe migration smoke test. |
| `php artisan migrate:fresh --seed` with SQLite in-memory test env | PASS | Safe seed smoke test. |

## C++ Judge

`g++` is available locally and `tests/Feature/LocalProcessJudgeTest.php` passes when the current shell PATH includes the compiler. If PATH was updated during the session, open a new terminal before rerunning.

## Known Skips

One backend security-hardening test may skip the local process temp-dir assertion when `JUDGE_USE_REAL` is not active in that specific test context. This is expected and keeps the default test environment safe.

## Environment Limitations

- MySQL verification depends on the local MySQL service being available. SQLite testing gates are the release baseline.
- Browser/VPN manual verification is still a demo checklist item.
- Reverb should be manually run during demos that need live websocket behavior.
- The local judge is not a production sandbox.
