# CP Coach Mode Wiring Matrix

Date: 2026-05-29

Scope: assistant mode selection and `/assistant/analyze` wiring for the CP Coach AI workspace.

## Shared Contract

| Layer | Evidence |
| --- | --- |
| Frontend selector | `resources/js/components/assistant/QuickModesBar.tsx` renders one accessible `<select data-testid="assistant-mode-select">` with grouped options. |
| Frontend mode metadata | `resources/js/lib/assistant-workspace.tsx` provides labels, descriptions, icons, aliases, and optgroup ordering. |
| Request payload | `resources/js/Pages/Assistant.tsx` appends `mode` to `FormData` before `POST /assistant/analyze`. |
| Route/API endpoint | `routes/web.php` defines authenticated `POST /assistant/analyze` handled by `AssistantController@analyze`. |
| Validation | `app/Http/Requests/AnalyzeRequest.php` allows `ModePrompts::allowedRequestModes()`. |
| Backend normalization | `app/Services/Assistant/Prompts/ModePrompts.php` normalizes aliases and returns mode-specific instructions. |
| Provider/service | `app/Jobs/ProcessAnalysisJob.php` calls `app/Services/Assistant/AnalysisService.php`, which uses `PromptOrchestrator` and the resolved AI/STT/TTS providers. |
| Response shape | Analyze: `{ session_id, message_id, status, client_request_id }`. Polling: `{ status, partial_text, full_text, audio_ready, audio_url, error }`. |
| Translation approach | Inline AR/EN metadata in `assistant-workspace.tsx`; no keyed i18n catalog exists yet. |
| Tests | `resources/js/Pages/Assistant.test.jsx`, `tests/Unit/PromptOrchestratorTest.php`, `tests/e2e/functional/assistant-shell.functional.spec.ts`, and visual dropdown coverage via `tests/e2e/visual/assistant-controls.visual.spec.ts`. |

## Mode Matrix

| Mode name | Payload | Frontend component/file | Route/API endpoint | Backend controller/service/provider | Response shape | Translation keys | Tests covering it | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Topic | `topic_explanation` | `QuickModesBar.tsx`, `assistant-workspace.tsx` | `POST /assistant/analyze` | `AnalyzeRequest` -> `AssistantController` -> `PromptOrchestrator` -> `ModePrompts::MODES` | Shared analyze/status JSON | Inline AR/EN mode metadata | Assistant unit dropdown values, PromptOrchestrator provider, E2E dropdown values, visual mode fixture | Working | Advanced learning group. |
| Recommend | `topic_recommendation` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Advanced learning group. |
| Hint | `hint` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Primary mode. |
| Check | `idea_check` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Primary mode, canonical replacement for legacy `check`. |
| Critique | `logic_critique` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Advanced learning group. |
| Edge cases | `edge_cases` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Primary mode. |
| Complexity | `complexity` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Primary mode. |
| Full solve | `full_solution` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Advanced learning group; legacy `full` still normalizes here. |
| Step by step | `step_by_step_solution` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Advanced learning group; legacy `summarize` still normalizes here. |
| Compare | `approach_compare` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Advanced learning group. |
| Mistakes | `common_mistakes` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Advanced learning group. |
| Solve | `solve` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Production group. |
| Code | `generate_code` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Production group. |
| Tests | `generate_tests` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Production group. |
| Verify | `verify_code` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Production group. |
| Debug WA | `debug_wrong_answer` | Same | Same | Same | Shared | Inline AR/EN mode metadata | Same | Working | Primary mode. |
| Wrong answer | `wrong` | Same | Same | `ModePrompts::LEGACY_ALIASES['wrong']` -> `logic_critique` | Shared | Inline AR/EN alias metadata | Assistant unit dropdown values, PromptOrchestrator provider, E2E dropdown values, visual mode fixture | Fixed | Kept as explicit dropdown option for user wording while backend safely normalizes it. |
| Summarize | `summarize` | Same | Same | `ModePrompts::LEGACY_ALIASES['summarize']` -> `step_by_step_solution` | Shared | Inline AR/EN alias metadata | Same | Working | Legacy payload remains accepted. |
| Next step | `next_step` | Same | Same | `ModePrompts::LEGACY_ALIASES['next_step']` -> `step_by_step_solution` | Shared | Inline AR/EN alias metadata | Same | Fixed | Added alias so the requested user-facing mode has first-class frontend and backend acceptance. |

## UX Status

- Mode selection is now one dropdown only; header shortcut buttons were removed.
- Primary modes appear first in the dropdown: Hint, Check, Debug WA, Complexity, Edge cases.
- Secondary modes are grouped with `<optgroup>` sections: learning/analysis, solve/code, and focused request aliases.
- The selected mode is obvious through the select value plus a visible description card.
- AR/EN labels and descriptions are provided inline for every canonical and explicit alias mode.
