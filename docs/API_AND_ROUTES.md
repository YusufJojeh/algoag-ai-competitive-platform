# ALGOAG API And Routes

ALGOAG primarily uses server-rendered Inertia routes rather than a public JSON API.

## Public Routes

- `GET /`: Landing page with public topics from `tags`.
- `GET /patterns`: pattern library index.
- `GET /patterns/{pattern}`: pattern details.
- `GET /login`: login form.
- `GET /register`: registration form.

## Auth Routes

- `POST /login`
- `POST /register`
- `POST /logout`
- `GET /onboarding`
- `POST /onboarding`

## Problems

- `GET /problems`: public problems only. Supports `?topic={slug}`.
- `GET /problems/{problem}`: public problem show route.
- `POST /submissions`: create Python/C++ submission.
- `GET /submissions`: current user's submissions.
- `GET /submissions/{submission}`: current user's submission result.

## Arena

- `GET /arena`: public Arena index.
- `GET /arena/{contest}`: contest show page.
- `POST /arena/{contest}/join`: join contest.
- `GET /arena/{contest}/problems/{problem}`: contest-scoped problem page.
- `GET /arena/{contest}/standings`: standings.

Contest gatekeeping is backend-driven; the frontend does not decide whether a timed contest accepts submissions.

## Assistant

- `GET /assistant`
- `POST /assistant/analyze`
- `GET /assistant/sessions`
- `GET /assistant/sessions/{session}`
- `GET /assistant/messages/{message}/status`
- `POST /assistant/messages/{message}/cancel`
- `GET /assistant/audio/{message}` with signed URL middleware.

## Codeforces Solver

- `GET /solve`: solver form.
- `POST /solve`: queue Python/C++ solver workflow.
- `GET /solve/result/{id}`: result page.
- `GET /solve/result/{id}/status`: polling status endpoint.

## Admin Routes

All admin routes require auth and admin middleware:

- `/admin`: dashboard.
- `/admin/users`: user management.
- `/admin/topics`: topics/tags CRUD.
- `/admin/courses`: courses and lessons CRUD.
- `/admin/problems`: problems, tags, and test cases CRUD.
- `/admin/contests`: timed/practice contests and contest-only problems CRUD.
- `/admin/settings`: settings page.

## E2E Routes

Local/testing only:

- `/__e2e/visual/*`
- `/__e2e/runtime/*`

Runtime fixture routes are protected by `ENABLE_E2E_FIXTURES` and `X-E2E-Secret`.

## Scheduled Commands

- `assistant:cleanup`: hourly.
- `ai:mark-stale-jobs`: every five minutes.
- `arena:publish-ended-problems`: every ten minutes, without overlap.

## Useful Artisan Commands

```bash
php artisan optimize:clear
php artisan route:list
php artisan schedule:list
php artisan queue:work
php artisan schedule:work
php artisan reverb:start --host=127.0.0.1
php artisan arena:publish-ended-problems
php artisan test
```
