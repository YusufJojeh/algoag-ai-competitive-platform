# CP Coach AI UX + Landing Upgrade Plan

This document was created before implementation edits for the CP Coach AI upgrade.

## Current Feature Inventory

- Laravel 12 + Inertia React app with Arabic as the default UI locale and English support through `ui_locale`.
- Public landing page with animated hero, voice/vision product positioning, feature sections, trust section, and final CTA.
- Authenticated assistant workspace with screen sharing, frame capture, voice recording, server-side transcription fallback, text prompts, assistant modes, realtime/polling status updates, cancellation, TTS playback, and session/message APIs.
- Algorithm suggestion flow backed by Ollama: problem description to candidate algorithms, local benchmark simulation, recommendation, and saved `algorithm_sessions`.
- Codeforces-style solve flow backed by Ollama: pasted statement parsing, solution generation in C++ or Python, explanation, generated tests, stub/local judge reporting, progress stages, polling, websocket notification, and saved solution history.
- CP content library with content-backed patterns/topics, related techniques, representative problems, metadata, filters, and pagination.
- Problem bank, course tracks, submissions log, admin problem CRUD, authentication, rate limiting, E2E fixture routes, visual tests, functional tests, and backend PHPUnit coverage.
- AI production hardening work in progress: provider resolution, usage limits, queue safety, stale job command, safe provider logging, OpenAI STT/TTS/vision provider support, and AI usage records.

## Issues Found

- Legacy `Home`, `Suggestions`, and `Results` pages still use the old standalone Arabic-only layout instead of the shared adaptive app shell.
- `CodeforcesResult` has Arabic-only tab labels and several Arabic-only runtime messages even when English UI mode is active.
- `CodeforcesSolve` has an Arabic-only Ollama warning and Arabic-only recent-solution status labels.
- Several assistant context/message surfaces use white or near-white backgrounds while inheriting dark-theme foreground tokens, creating low-contrast text and inconsistent visual direction.
- Landing copy is polished but still too broad; it should name competitive programming, contests, constraints, edge cases, code verification, and learning loops more directly.
- Empty/error/loading states exist, but the older suggestion/benchmark flow needs better empty and fallback states aligned with the newer app.

## Implementation Changes To Make

- Update landing marketing copy and feature sections to position ALGOAG as a competitive-programming coach for problem reading, hints, complexity, edge cases, code verification, and contest practice in Arabic and English.
- Repair assistant workspace contrast by making message, live context, timeline, audio, and context-header surfaces consistently dark or token-compatible.
- Keep assistant controls adaptive and bilingual while making mode labels and helper text more CP-specific where the existing feature set supports it.
- Localize Codeforces result tabs, headings, processing messages, fallback text, and status labels for both Arabic and English.
- Localize Codeforces solve warnings and recent status labels for both Arabic and English.
- Move `Suggestions` and `Results` into the shared `AppLayout`, add bilingual copy, empty states, loading/processing affordances, error-aware rows, and clearer CTAs back to Assistant, Solve, and Problems.
- Keep backend contracts unchanged unless a frontend bug requires a minimal compatibility adjustment.
- Update focused tests if copy or accessible labels change.

## Verification Plan

- Run frontend unit tests for affected pages/components.
- Run `npm run build`.
- Run targeted backend tests if controller contracts are touched.
- Run or inspect E2E visual coverage for landing, assistant states, and bilingual shell if time allows.
- Use the local browser to inspect landing and assistant at desktop/mobile widths once the app builds.
