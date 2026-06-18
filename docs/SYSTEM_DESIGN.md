# ALGOAG System Design

## Problem Statement

Competitive programming learners need a single local platform where they can practice public problems, submit code, join timed contests, review standings, and use AI support without mixing unrelated tools.

## Goals

- Make Problems the main learning surface.
- Support Python and C++ submissions with hidden tests.
- Provide Arena contests with realistic start/end gatekeeping.
- Keep contest-only problems private until the contest ends.
- Publish ended contest problems automatically through backend scheduling.
- Let admins manage topics, courses, lessons, problems, contests, users, and settings.
- Keep local development and demo setup reproducible.

## Non-Goals

- Production-grade judge isolation in the current local process runner.
- Multi-tenant classroom management.
- Full online deployment automation.
- Plagiarism detection.
- Arbitrary language support beyond Python and C++.

## Actors

- Guest: can view the landing page, patterns, login, and register screens.
- User/learner: can solve problems, submit code, join Arena, view own submissions, use assistant and Codeforces solver.
- Admin: can manage users, topics, courses/lessons, problems, contests, and settings.

## Core User Journeys

1. Learner registers or logs in.
2. Learner opens Problems and filters by topic.
3. Learner submits Python/C++ code.
4. Queue runs the configured judge.
5. Learner reviews verdict and visible sample information.
6. Learner joins Arena and submits during the valid time window.
7. Learner reviews standings.
8. Admin creates content and contests.
9. Scheduler publishes contest-only problems after timed contests end.

## Contest Lifecycle

1. Admin creates a timed or practice contest.
2. Timed contest requires `starts_at` and duration.
3. Backend computes `ends_at = starts_at + duration`.
4. Admin attaches public problems or creates contest-only private problems.
5. Users join the contest.
6. Before start, problem viewing/submissions are blocked for timed contests.
7. During the contest, joined users can view and submit.
8. After end, submissions close and standings remain available.
9. Scheduler publishes private contest-only problems if the contest is timed, ended, non-practice, and not already published.
10. Difficulty is computed from contest performance.

## Local Judge Design

The app resolves `CodeJudge` through Laravel's service container:

- `JUDGE_USE_REAL=false`: `StubCodeJudge`, no code execution.
- `JUDGE_USE_REAL=true`: `LocalProcessJudge`, executes Python/C++ locally.

`ProcessSubmissionJob` receives the judge result and stores:

- top-level verdict,
- runtime,
- per-case verdict/runtime,
- judge engine metadata.

It does not store or expose hidden test input/output in the frontend result payload.

## Hidden Test Design

Problem test cases are stored in `problem_test_cases`. Each case has `is_sample`. Sample cases may be shown in submission results. Hidden case input and expected output are used by the judge only and are not sent to the browser.

## Difficulty Calculation

After a timed contest ends, publishing computes difficulty for each private contest-only problem:

- `participants_count = 0`: `extreme`
- `accepted_solvers_count = 0`: `extreme`
- `easy`: solve rate `>= 0.65` and median first accepted time `<= 20` minutes
- `medium`: solve rate `>= 0.35` and median first accepted time `<= 45` minutes
- `hard`: solve rate `>= 0.15` or median first accepted time `<= 90` minutes
- otherwise: `extreme`

Only each participant's first accepted submission counts. Wrong answers do not count as solved. If participant count is less than 3, an `easy` result is downgraded to `medium`.

## Realtime / Polling Strategy

Reverb/Echo is configured for local development with `127.0.0.1`. Private channels are protected in `routes/channels.php`. Frontend flows also expose status endpoints and polling-compatible result pages so local demos are not blocked if WebSocket connection fails.

## Admin Management Model

Admin functionality is routed under `/admin` with auth and admin middleware. Resources:

- Users: list and update user state.
- Topics: CRUD for `tags`.
- Courses: CRUD with lessons.
- Problems: CRUD with tags and test cases.
- Contests: timed/practice contests, duration, public/private attachments, and contest-only problems.
- Settings: admin settings screen.

## Limitations

- The local process judge is not a production sandbox.
- Browser/VPN verification should be performed manually for final demo machines.
- MySQL verification depends on local MySQL availability; tests use SQLite.
- Reverb should be run manually during a realtime demo.

## Future Improvements

- Docker/gVisor/Firejail-backed judge isolation.
- Deployment runbooks and health checks.
- Admin analytics and contest insights.
- Classroom/team management.
- Plagiarism detection.
