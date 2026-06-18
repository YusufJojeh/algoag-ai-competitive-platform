# ALGOAG Portfolio Case Study

## Project

ALGOAG is a competitive programming learning platform built with Laravel 12, React/Inertia, and Shadcn-style UI components.

## Problem

Learners often need several disconnected tools: a problem bank, a judge, contest timing, standings, topic-based learning paths, and AI help. ALGOAG brings those workflows into one local platform suitable for a graduation demo and portfolio review.

## Solution

The platform centers on public problems and adds a Mini Codeforces-style Arena, Python/C++ submissions, hidden tests, AI-assisted solving, Codeforces-style solution generation, and admin content management.

## My Role

Full-stack implementation across Laravel backend, React/Inertia frontend, database design, queue/scheduler workflows, local judge integration, admin management, test coverage, and release documentation.

## Key Features

- Problems-first UX.
- Python and C++ submissions.
- Hidden test cases.
- Timed and practice Arena contests.
- Contest-only private problems.
- Automatic post-contest publishing.
- Difficulty computed from contest performance.
- ICPC-style standings.
- Admin management for users, topics, courses, lessons, problems, contests, and settings.
- AI assistant and Codeforces solver.

## Technical Challenges

- Keeping contest-only problems hidden without relying on frontend checks.
- Preserving timed contest gatekeeping while moving admin input from manual end time to duration.
- Computing deterministic difficulty from first accepted submissions.
- Supporting local Reverb/Echo while keeping polling fallback flows usable.
- Making the local judge honest and safe by default.

## Architecture Decisions

- Laravel remains the source of truth for authorization, validation, timing, and visibility.
- React/Inertia handles interface state without duplicating security decisions.
- Topics use the existing `tags` model and `problem_tag` pivot.
- `ends_at` stays in the database and is computed from `starts_at + duration`.
- Publishing is backend-driven through service, Artisan command, and scheduler.

## Security Decisions

- Hidden tests are never sent to the browser.
- Users can view only their own submissions.
- Admin routes are protected by middleware.
- Private contest-only problems are blocked from public Problems until published.
- The real local judge is disabled by default and must not be described as production-safe without sandboxing.

## Testing Quality

The project includes backend feature/unit tests, frontend Vitest coverage, build validation, TypeScript linting, route checks, schedule checks, and safe SQLite migration/seed smoke tests.

## What Makes It Different

ALGOAG connects learning paths, topic-driven practice, contests, submissions, standings, and AI workflows in one coherent product rather than treating them as separate demos.

## Results / Outcome

A portfolio-ready local platform that demonstrates full-stack product thinking, backend domain modeling, frontend implementation, queue/scheduler operations, and honest security boundaries.

## Tech Stack

Laravel 12, PHP 8.2+, React 18, Inertia.js, Vite, Tailwind CSS, Shadcn-style components, Reverb/Echo, PHPUnit, Vitest, OpenAI/Ollama-compatible AI flows, Python/C++ local judge.

## Demo Script

1. Open Landing and show topics.
2. Log in as demo user.
3. Open Problems and solve a problem.
4. Submit Python/C++ and show verdict.
5. Join Arena and show countdown/running state.
6. Open standings.
7. Log in as admin and show topics, courses, problems, contests.
8. Create a contest-only problem.
9. Run publishing command after contest end.
10. Confirm the problem appears publicly with computed difficulty.
11. Show AI assistant and Codeforces solver.

## Screenshots Placeholders

- `[Landing screenshot]`
- `[Problems list screenshot]`
- `[Problem show screenshot]`
- `[Submission result screenshot]`
- `[Arena screenshot]`
- `[Standings screenshot]`
- `[Admin dashboard screenshot]`
- `[AI assistant screenshot]`
