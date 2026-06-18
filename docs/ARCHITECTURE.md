# ALGOAG Architecture

## High-Level Architecture

ALGOAG is a Laravel monolith with an Inertia-powered React frontend. Laravel owns routing, authentication, authorization, validation, persistence, queues, scheduling, broadcasting, and the local judge boundary. React owns the interactive user and admin screens.

```mermaid
flowchart LR
    Browser[React/Inertia Browser] --> Laravel[Laravel HTTP Layer]
    Laravel --> DB[(Database)]
    Laravel --> Queue[Laravel Queue]
    Laravel --> Scheduler[Laravel Scheduler]
    Laravel --> Reverb[Reverb / Echo]
    Queue --> AI[AI Providers]
    Queue --> Judge[Local Judge]
    Scheduler --> Publisher[Contest Publishing Service]
    Publisher --> DB
```

## Backend Structure

- `routes/web.php`: public, auth, problems, submissions, Arena, assistant, Codeforces, and admin routes.
- `routes/console.php`: scheduled cleanup, stale AI job marking, and Arena publishing.
- `routes/channels.php`: private broadcast authorization channels.
- `app/Http`: shared controllers, requests, middleware, and auth.
- `app/Modules`: domain modules for Admin, Arena, Execution, Problems, Patterns, Realtime, and Assistant actions.
- `app/Services`: AI, assistant, content, Codeforces, benchmark, and provider services.
- `app/Jobs`: queued processing for submissions, assistant analysis, and Codeforces solving.
- `app/Policies`: user-level access rules for submissions, assistant sessions, Codeforces solutions, and problems.

## Frontend Structure

- `resources/js/app.jsx`: Inertia bootstrapping and global providers.
- `resources/js/bootstrap.js`: Axios/Echo setup and runtime configuration.
- `resources/js/Pages`: route-level pages for Landing, Problems, Arena, Admin, Assistant, Codeforces, Courses, and Submissions.
- `resources/js/components/ui`: local Shadcn-style primitives such as Button, Card, Badge, Table, Input, Textarea, and Alert.
- `resources/js/lib`: frontend helpers for locale, assistant workspace state, verdicts, and E2E visual support.

## Module Overview

### Problems

Problems live in `App\Modules\Problems\Models\Problem`. Public visibility requires `is_public=true`, `published_at` not null, and `published_at <= now()`. Tags/topics use the `Tag` model through the `problem_tag` pivot.

### Submissions

`SubmissionController` creates submissions after authorization and contest gate checks. `ProcessSubmissionJob` runs the configured `CodeJudge` and stores sanitized verdict data. Hidden test input and expected output are not exposed to the browser.

### Arena / Contests

`Contest` supports timed contests and practice contests. Timed contests use `starts_at` and computed `ends_at`; admin users enter start time plus duration. Gatekeeping is centralized through methods such as `acceptsSubmissions()`, `hasStarted()`, and `hasEnded()`.

### Publishing

`PublishEndedContestProblemsService` scans ended, non-practice contests with unpublished contest-only problems. It computes difficulty, publishes problems, and marks `problems_published_at`. The command is `arena:publish-ended-problems`.

### Standings

`StandingService` computes ICPC-style rankings: solved count descending, penalty ascending, and a 20-minute penalty for wrong attempts before first accepted submission.

### AI Assistant

Assistant routes and services support session-based analysis, provider resolution, STT/TTS, and broadcast/polling status updates.

### Codeforces Solver

`CodeforcesSolveController`, `QueueCodeforcesSolutionAction`, and `CodeforcesSolverService` coordinate Python/C++ solution generation, repair, explanation, and result status.

### Admin

Admin routes are protected by auth and admin middleware. Admin pages manage users, topics, courses/lessons, problems/tags/test cases, contests, and settings.

### Courses / Topics

Courses have ordered lessons. Topics are the `tags` table, shared between Admin, Landing, Problems filters, and problem cards.

## Data Flows

### User Submits Solution

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React/Inertia
    participant C as SubmissionController
    participant Q as Queue
    participant J as CodeJudge
    participant DB as Database
    U->>UI: Submit code
    UI->>C: POST /submissions
    C->>C: Authorize and gate contest access
    C->>DB: Create pending submission
    C->>Q: Dispatch ProcessSubmissionJob
    Q->>J: Run stub or local judge
    J-->>Q: Verdict and per-case metadata
    Q->>DB: Store sanitized result
    UI->>C: Load submission result
```

### Contest Lifecycle

```mermaid
flowchart TD
    A[Admin creates contest] --> B[Set starts_at + duration]
    B --> C[Backend computes ends_at]
    C --> D[Users join]
    D --> E{Current time}
    E -->|before starts_at| F[Upcoming: no submissions]
    E -->|starts_at..ends_at| G[Running: submissions accepted]
    E -->|after ends_at| H[Ended: submissions closed]
    H --> I[Standings remain available]
```

### Contest-Only Problem Publishing

```mermaid
flowchart TD
    A[Private contest-only problem] --> B[Hidden from public Problems]
    B --> C[Contest ends]
    C --> D[Scheduler runs arena:publish-ended-problems]
    D --> E[Compute participant-based difficulty]
    E --> F[Set is_public, published_at, difficulty]
    F --> G[Problem appears on /problems]
```

### AI Solver Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Solve Page
    participant C as Codeforces Controller
    participant Q as Queue
    participant S as CodeforcesSolverService
    participant AI as Text Generator
    U->>UI: Paste problem and select Python/C++
    UI->>C: POST /solve
    C->>Q: Queue solver job
    Q->>S: Run pipeline
    S->>AI: Generate/repair/explain
    S->>Q: Persist progress and result
    UI->>C: Poll result status
```

## Queue Flow

The queue processes:

- `ProcessSubmissionJob` for local/stub judging.
- `ProcessCodeforcesSolutionJob` for AI Codeforces solving.
- `ProcessAnalysisJob` for assistant workflows.

Use `QUEUE_CONNECTION=database` and run:

```bash
php artisan queue:work
```

## Scheduler Flow

```mermaid
flowchart LR
    Schedule[Laravel Scheduler] --> Cleanup[assistant:cleanup hourly]
    Schedule --> Stale[ai:mark-stale-jobs every 5 min]
    Schedule --> Publish[arena:publish-ended-problems every 10 min]
```

## Security Boundaries

- Admin routes require authenticated admin users.
- Users can only view their own submissions.
- Hidden tests are never sent to the browser.
- Contest-only problems are hidden from public routes until published.
- Private broadcast channels verify user IDs.
- Real local judge execution is disabled by default and must not be used in production without sandboxing.
