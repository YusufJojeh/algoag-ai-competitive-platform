---
name: algoag-project
description: Guides development on the AlgoAG Laravel competitive-programming learning platform. Enforces brownfield discipline—inspect real code before claims, evidence-based status (implemented/partial/scaffold/broken/missing), modular monolith, safe execution, Ollama flows, Arabic-first UX, and real-time-first design. Use when working in this repository, planning or reviewing features, assessing implementation truth, or when the user mentions AlgoAG, competitive programming, patterns, benchmarks, verification, Ollama, or Codeforces flows.
---

# AlgoAG project context

## What this project is

You are working on an **existing, partially built** Laravel project called **AlgoAG**. Core objective: transform it into a **maintainable competitive-programming learning platform** with:

- Curated pattern library
- Representative problems
- C++ and Python reference solutions
- Detailed explanations
- Test samples and large generated tests
- Safe execution / verification flow
- Ollama-assisted pattern matching and explanation
- Real-time user experience for AI streaming, test status, notifications, and activity progress

## Hard rules

1. **Not greenfield** — Treat AlgoAG as a brownfield codebase; extend and repair, do not assume a blank slate.
2. **Inspect the REAL codebase before making claims** — Routes, controllers, services, models, migrations, frontend pages, jobs, config, and tests are the authority.
3. **Code is the source of truth** — Implementation beats intention.
4. **Markdown docs are not proof** — READMEs and comments may be aspirational; verify behavior in code and tests.
5. **Do not invent completed features** — If something is not wired or untested, do not describe it as done.
6. **Always separate status** — Use the taxonomy below in every feature or area assessment:

| Label | Meaning |
|-------|--------|
| **Implemented and usable** | Wired, reachable, behavior supported by tests or clear in-repo evidence |
| **Partial** | Some layers exist; gaps in validation, UX, integration, or coverage |
| **Scaffold only** | Stubs, placeholders, or thin wiring without full behavior |
| **Broken / inconsistent** | Conflicting layers, failing tests, unsafe paths, or contradictions |
| **Missing** | Not present in code |

If you cannot verify after inspection, state what you checked and mark the remainder **unknown** until verified.

## Engineering principles

- **Maintainable modular monolith** — Clear modules; avoid spaghetti across layers.
- **Content-first architecture** — Problems, patterns, and explanations are first-class structured content.
- **Clear service boundaries** — Thin controllers; domain logic in services/models; explicit contracts.
- **Strict validation** — Request validation; typed boundaries where the stack allows; fail closed on bad input.
- **Safe execution isolation** — User- or model-produced code runs only in controlled, resource-bounded execution paths (design and review with this as non-negotiable).
- **Strong observability** — Log meaningful events; surface failures; avoid silent degradation.
- **Arabic-first UX with English-ready content structure** — Primary UI for Arabic users; problem/pattern content structured for straightforward bilingual expansion.
- **Real-time must be first-class** — Streaming, progress, and notifications belong in core design, not as a late add-on.

## Output style

- **Brutally strict** — No filler, no optimism without evidence.
- **Evidence-based** — Cite files, routes, tests, or observed behavior.
- **Practical** — Smallest change that increases safety or truth about the system.
- **Phased** — Milestones and order of operations, not vague roadmaps.
- **No fluff**

## Before architecture or “next steps”

1. Locate entry points: `routes/`, `app/Http/Controllers/`, `app/Services/`, `resources/js/Pages/`, plus jobs/events/broadcasting if relevant.
2. Read **tests** under `tests/` for intended and enforced behavior.
3. For execution or AI features, explicitly address **validation, isolation, and failure modes**.

## Status report template

When summarizing an area or feature, use a short structured block:

```markdown
## [Feature or area]

- **Status**: implemented and usable | partial | scaffold only | broken/inconsistent | missing
- **Evidence**: [paths, tests, routes]
- **Gaps / risks**: [if any]
- **Next concrete step**: [one action]
```

## Progressive disclosure

Keep this file under ~500 lines. For team-only conventions or long checklists, add a sibling file (e.g. `reference.md`) and link it here.
