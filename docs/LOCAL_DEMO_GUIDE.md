# ALGOAG Local Demo Guide

## Environment

Set a stable app timezone:

```env
APP_TIMEZONE=Asia/Damascus
APP_URL=http://127.0.0.1:8000
```

For VPN-safe local development, prefer `127.0.0.1` instead of `localhost` or a LAN IP:

```env
VITE_DEV_SERVER_HOST=127.0.0.1
VITE_DEV_SERVER_PORT=5173
VITE_HMR_HOST=127.0.0.1
REVERB_HOST=127.0.0.1
REVERB_SERVER_HOST=127.0.0.1
```

Then clear cached config:

```bash
php artisan optimize:clear
```

## Run Laravel

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

## Run Vite

```bash
npm run dev
```

## Run Queue

```bash
php artisan queue:work
```

## Run Scheduler

```bash
php artisan schedule:work
```

## Run Reverb

```bash
php artisan reverb:start --host=127.0.0.1
```

## Publish Ended Contest Problems

```bash
php artisan arena:publish-ended-problems
```

## Testing

```bash
php artisan test
npm run test
npm run build
npm run lint
```

## Windows g++ Setup

Install MSYS2 or MinGW-w64 and ensure `g++.exe` is on PATH.

Verify:

```bash
g++ --version
php artisan test tests/Feature/LocalProcessJudgeTest.php
```

If the current terminal does not see PATH updates, open a new terminal.

## Demo Checklist

1. Seed the database.
2. Log in as `admin@example.com` / `password`.
3. Create a topic.
4. Create or edit a problem and attach the topic.
5. Confirm `/problems?topic=topic-slug` filters the problem.
6. Create a timed Arena starting in two minutes.
7. Add a contest-only private problem.
8. Log in as `demo@example.com` / `password`, join the Arena, and watch before/running states.
9. Submit Python or C++.
10. Open standings.
11. End the contest or wait until it ends.
12. Run `php artisan arena:publish-ended-problems`.
13. Confirm the contest-only problem appears on `/problems` with computed difficulty.
14. Show the AI assistant and Codeforces solver.
