# AlgoAG Visual Asset Plan

## Purpose

This plan defines the placeholder and production-ready image strategy for the unified AlgoAG assistant product.

Rules:
- Use the landing page as the visual source of truth.
- Keep all imagery dark, technical, premium, and AI-native.
- Avoid generic SaaS blobs, cartoon illustrations, and stock-photo aesthetics.
- Support Arabic-first layouts without baking text into raster assets.

## Asset Groups

### 1. Authenticated assistant hero
- Placement: assistant empty state, assistant onboarding, product marketing callouts.
- Goal: show a serious competitive-programming workspace with statement, code, and AI guidance.
- Visual anchors: code editor, contest statement panes, waveform/reasoning cues, graph/grid abstractions.

Prompt:
`Premium dark AI competitive programming workspace, dual-panel coding interface, algorithm problem statement, code editor, subtle waveform reasoning cues, cyan and violet luminous gradients, technical UI overlays, cinematic lighting, modern developer product illustration, clean composition, no cartoon style, no stock photo look, no embedded text`

### 2. Topic explorer hero
- Placement: `Patterns/Index`, future topic landing sections.
- Goal: communicate browsing by algorithmic topic instead of generic chat.
- Visual anchors: graph nodes, DP tables, array windows, binary search ranges, string matching motifs.

Prompt:
`Premium dark algorithm topic explorer illustration, graph nodes, dynamic programming table fragments, binary search range markers, string pattern overlays, cyan violet glow, polished developer education product style, minimal but powerful composition, no text, no cartoon style`

### 3. Topic detail header
- Placement: `Patterns/Show`, future topic detail cards.
- Goal: visually distinguish each topic without introducing a disconnected art style.
- Variant strategy: one master composition per topic family with consistent lighting and palette.

Prompt template:
`Premium dark illustration for {topicName} in a competitive programming learning platform, show the core structure of the technique, abstract code and data structure motifs, cyan violet gradient lighting, serious technical atmosphere, elegant composition, no labels, no stock art`

### 4. Problem analysis state
- Placement: assistant empty state, Codeforces solve, future pasted-statement flows.
- Goal: show the system reading a statement, validating reasoning, and surfacing hints.

Prompt:
`Dark premium AI problem analysis illustration, contest problem statement panel, reasoning checklist, edge case notes, complexity indicators, technical UI overlays, cyan and violet highlights, modern coding product art, no text, no cartoon style`

### 5. Empty and status states
- Placement: no sessions, no topic matches, no submissions, verification unavailable.
- Goal: keep the product visually strong without pretending unsupported features are complete.

Prompts:
- `Dark premium empty state illustration for saved assistant sessions, minimal technical scene, subtle timeline and notebook motifs, cyan violet glow`
- `Dark premium empty state illustration for no search results in algorithm topic explorer, refined grid and graph hints, subdued but polished`
- `Dark premium verification unavailable illustration, safe sandbox not yet active, technical warning tone, elegant cyan violet highlights, honest product state`

## Placement Strategy

- Use imagery sparingly.
- Prioritize these surfaces:
  - landing hero
  - assistant first-run empty state
  - topic explorer header
  - topic detail header
  - major empty states only
- Do not place large illustrations inside dense code/result panels.
- Do not mix multiple illustration styles in the same route.

## Implementation Guidance

- Prefer raster exports with transparent or dark-friendly backgrounds.
- Keep text out of the generated images so Arabic/English copy stays in code.
- Use the same cyan-violet-slate palette family already established in the landing page and shell.
- If final branded artwork is unavailable, use these prompts to generate placeholders and place them behind cards or in reserved hero slots without changing layout structure later.
