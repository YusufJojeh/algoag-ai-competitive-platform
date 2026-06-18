# ALGOAG Security Notes

## Protected Content

- Hidden test inputs and expected outputs are never sent to the browser.
- Submission result pages expose only sample test I/O where `is_sample=true`.
- Private contest-only problems are blocked from public Problems index and show routes until publishing.
- Public problem visibility requires `is_public=true` and a valid `published_at`.

## Access Control

- Admin routes live under `/admin` and require auth plus admin middleware.
- Users can view only their own submissions.
- Contest submissions require the user to have joined the contest.
- Timed contest submissions are accepted only inside the contest window.
- Practice contests accept submissions anytime after joining.
- Private broadcast channels verify the authenticated user ID.

## Local Judge Risk

The local process judge executes submitted Python/C++ code on the host machine when `JUDGE_USE_REAL=true`. This is suitable only for trusted local development/demo machines.

Production needs real sandboxing before enabling execution of untrusted submissions:

- Docker with locked-down containers and resource limits.
- gVisor for stronger syscall isolation.
- Firejail or another OS-level sandbox.

The application includes a production guard: `JUDGE_USE_REAL=true` is blocked in production unless a sandbox driver is configured or an explicit unsafe override is set.

## Current Local Assumptions

- `.env.example` keeps `JUDGE_USE_REAL=false`.
- Developers may enable `JUDGE_USE_REAL=true` locally after installing Python and g++.
- Queue workers and scheduler run on the same trusted machine in local demos.
- Reverb local development should use `127.0.0.1` to avoid VPN/LAN IP drift.

## Environment Variables

Do not commit:

- `.env`
- API keys
- OpenAI keys
- database dumps
- local storage artifacts
- generated audio/images
- `node_modules`
- `vendor`

Use `.env.example` only for safe defaults and blank secret placeholders.
