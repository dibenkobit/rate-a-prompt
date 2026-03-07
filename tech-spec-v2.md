# Plan: prompt-rate — Side-by-Side System Prompt Comparison Tool

## Context

There's no good tool to verify which system prompt is better. Users of LLMs who write their own system prompts currently rely on manual testing or buying unverified "ready-to-go" prompts. This tool lets users compare two system prompts side-by-side, see model responses, and optionally have up to 5 evaluator models rate both responses 0-10. Free, non-profit, BYOK (OpenRouter).

---

## Tech Stack

- **Next.js App Router** + TypeScript strict + Bun
- **tRPC v11** with streaming subscriptions (async generators over SSE)
- **Shadcn UI** + Lucide + Tailwind CSS v4 + Motion
- **Biome** config adapted from `~/projects/concilium/web`
- **Zod** for validation

---

## Reused from Concilium (`~/projects/concilium/web`)

These components/patterns are copied and adapted (not imported — separate project):

| Source file | Reuse in prompt-rate | Adaptations |
|---|---|---|
| `biome.json` | `biome.json` | Remove `!**/routeTree.gen.ts`, add `!**/.next` |
| `src/components/ai-elements/model-selector.tsx` | `src/components/ai-elements/model-selector.tsx` | Copy as-is (Popover+Command compound component) |
| `src/components/concilium/model-picker.tsx` | `src/components/model-picker.tsx` | Remove `AUTO_MODEL_ASSIGNMENTS` "Our picks" from multi-picker, add custom model ID text input at bottom of list, remove `isFree`/`FreeBadge` (not relevant), remove `container` prop |
| `src/lib/constants.ts` (MODELS, GROUPED_MODELS, MODEL_BY_ID) | `src/lib/constants.ts` | Strip `:online` suffix from model IDs, keep only model-related exports, add evaluation system prompt + defaults |
| `src/lib/types.ts` (ModelInfo) | `src/lib/types.ts` | Keep `ModelInfo` type with `tier`, add comparison-specific types |
| `src/components/concilium/chat-container.tsx` | `src/components/user-input.tsx` | Reuse input area styling pattern (rounded container, textarea on top, toolbar at bottom) |

---

## File Structure

```
prompt-rate/
├── biome.json
├── components.json                    # shadcn config
├── next.config.ts
├── tsconfig.json
├── package.json
├── .gitignore
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout, TRPCProvider wrapper
│   │   ├── page.tsx                   # Server component -> renders ComparisonWorkbench
│   │   ├── globals.css                # Tailwind v4 @import + oklch theme
│   │   └── api/trpc/[trpc]/route.ts  # tRPC HTTP handler (GET+POST)
│   ├── components/
│   │   ├── ui/                        # Shadcn auto-generated
│   │   ├── ai-elements/
│   │   │   └── model-selector.tsx     # REUSED from concilium (Popover+Command compound)
│   │   ├── comparison-workbench.tsx   # Main orchestrator ('use client')
│   │   ├── prompt-editor.tsx          # System prompt textarea
│   │   ├── user-input.tsx             # User question input + config bar + send
│   │   ├── config-panel.tsx           # Model picker, evaluator picker, shuffle toggle
│   │   ├── model-picker.tsx           # REUSED from concilium (Single+Multi model picker)
│   │   ├── response-panel.tsx         # Single response display + prefer button + evals
│   │   ├── response-pair.tsx          # Side-by-side wrapper for two ResponsePanels
│   │   ├── evaluation-results.tsx     # Evaluator scores grid per response
│   │   ├── api-key-dialog.tsx         # Dialog for OpenRouter API key
│   │   └── header.tsx                 # App name + API key button
│   ├── hooks/
│   │   ├── use-comparison.ts          # Core state machine (editing->streaming->responded->revealed)
│   │   ├── use-api-key.ts             # localStorage API key management
│   │   └── use-streaming-response.ts  # tRPC subscription consumer
│   ├── lib/
│   │   ├── utils.ts                   # cn() helper
│   │   ├── constants.ts              # Model presets (from concilium), eval prompt, defaults
│   │   ├── types.ts                   # ModelInfo (from concilium) + comparison types
│   │   └── schemas.ts                # Zod schemas for tRPC inputs
│   └── trpc/
│       ├── init.ts                    # initTRPC, context, base procedures
│       ├── client.tsx                 # createTRPCReact + TRPCProvider + splitLink
│       ├── query-client.ts           # React Query client factory
│       └── routers/
│           ├── _app.ts               # Root appRouter
│           ├── completion.ts          # Streaming completion subscription
│           └── evaluation.ts          # Evaluation mutation
```

---

## Implementation Steps

### Phase 1: Scaffolding

1. `bunx create-next-app@latest . --typescript --tailwind --app --src-dir` (in prompt-rate dir)
2. Install deps: `@trpc/server@next @trpc/client@next @trpc/react-query@next @tanstack/react-query superjson zod motion lucide-react geist clsx tailwind-merge tw-animate-css`
3. Install dev deps: `@biomejs/biome`
4. Set up config files:
   - `biome.json` — adapted from concilium (4-space, single quotes, 120 line width, strict). Remove Vite/TanStack-specific excludes, add `!**/.next`
   - `tsconfig.json` — strict mode, `@/*` → `./src/*`
   - `next.config.ts` — minimal
5. `bunx shadcn@latest init` then add: button, textarea, switch, label, badge, popover, command, dialog, tooltip, separator, card, scroll-area, skeleton
6. Set up `globals.css` with Tailwind v4 `@import` + oklch theme (adapted from concilium, stripped of app-specific vars)

### Phase 2: tRPC Wiring

1. `src/trpc/init.ts` — initTRPC with superjson, context extracts `apiKey` from `x-openrouter-key` header
2. `src/trpc/query-client.ts` — React Query client factory
3. `src/trpc/routers/_app.ts` — placeholder root router
4. `src/app/api/trpc/[trpc]/route.ts` — fetchRequestHandler, passes API key to context
5. `src/trpc/client.tsx` — TRPCProvider with `splitLink`: subscriptions → `httpSubscriptionLink`, rest → `httpBatchStreamLink`. Both inject API key from localStorage as `x-openrouter-key` header
6. Wire TRPCProvider into `src/app/layout.tsx`

### Phase 3: Types, Constants, Schemas

1. `src/lib/types.ts` — copy `ModelInfo` type from concilium (with `tier: 'flagship' | 'mid-tier' | 'efficient'`), add `ComparisonConfig`, `ComparisonState`, `EvaluationResult`
2. `src/lib/constants.ts` — copy `MODELS` array from concilium, strip `:online` suffix from all IDs, copy `GROUPED_MODELS`/`MODEL_BY_ID`/`getModelDisplay` pattern. Add `EVALUATION_SYSTEM_PROMPT`, `DEFAULT_MODEL`, `DEFAULT_CONFIG`, `EVALUATOR_PICKS` (preset evaluator models)
3. `src/lib/schemas.ts` — Zod schemas for completion/evaluation inputs
4. `src/lib/utils.ts` — `cn()` helper
5. `src/components/ai-elements/model-selector.tsx` — copy from concilium as-is
6. `src/components/model-picker.tsx` — copy from concilium, adapt: remove `FreeBadge`, remove `AUTO_MODEL_ASSIGNMENTS` "Our picks" button, remove `container` prop, add a text input at the bottom of the list for pasting custom OpenRouter model IDs

### Phase 4: tRPC Routers

1. **`completion.ts`** — `generate` subscription (async generator):
   - Calls OpenRouter `POST /api/v1/chat/completions` with `stream: true`
   - Reads SSE stream, yields `{ type: 'delta', content }` for each chunk
   - Yields `{ type: 'done' }` on finish
2. **`evaluation.ts`** — `evaluate` mutation:
   - Calls OpenRouter non-streaming with evaluation system prompt + `response_format: { type: 'json_object' }`
   - Returns `{ score: number, reasoning: string }`
   - Includes fallback regex parsing if JSON parse fails
3. Merge routers in `_app.ts`

### Phase 5: Core UI

1. `use-api-key.ts` — localStorage read/write with `useSyncExternalStore`
2. `api-key-dialog.tsx` — password input dialog, save/clear
3. `header.tsx` — app name + API key status indicator
4. `prompt-editor.tsx` — labeled textarea (Prompt A / Prompt B)
5. `config-panel.tsx` — composes ModelPicker (single, for generation), ModelPicker (multi, for evaluators), shuffle switch
6. `user-input.tsx` — textarea + config bar + send button (styled after concilium's chat-container input area)
7. `response-panel.tsx` — streaming response display, "I prefer this one" button, evaluation scores. On reveal: shows the actual system prompt text that was behind it
8. `evaluation-results.tsx` — scores grid with average, loading skeletons
9. `response-pair.tsx` — 2-column grid (stacked on mobile)

### Phase 6: Orchestrator

1. `use-comparison.ts` — useReducer state machine:
   - **Shuffle logic**: on send, if shuffle enabled, randomly flip left=A/right=B vs left=B/right=A
   - **Send**: fires two parallel tRPC subscriptions
   - **Accumulate**: appends deltas to left/right responses
   - **Evaluate**: after both done, fires `Promise.allSettled` for all evaluator×response mutations
   - **Prefer**: records user preference, transitions to revealed phase
   - **Reveal**: exposes which prompt was behind each side + shows the prompt text
2. `comparison-workbench.tsx` — top-level client component composing everything
3. `page.tsx` — server component rendering `<ComparisonWorkbench />`

### Phase 7: Polish

1. Motion animations: fade-in responses, AnimatePresence for reveal, stagger for eval scores
2. Responsive: stack on mobile
3. Dark mode via oklch theme (system preference)

---

## Key Design Decisions

- **API key flow**: stored in client localStorage, sent per-request via `x-openrouter-key` header, extracted in tRPC context. Never persisted server-side.
- **Streaming via tRPC subscriptions**: tRPC v11 async generators over SSE. Type-safe, no custom EventSource handling.
- **State management**: single `useReducer` in `use-comparison.ts`. No external state library needed.
- **Shuffle**: assignment at send time, stored in hook state, revealed only when user picks preference.
- **Evaluations**: parallel mutations via `Promise.allSettled` (up to 10 calls: 5 evaluators × 2 responses).

---

## Evaluation System Prompt

```
You are an expert AI response evaluator. Your task is to objectively evaluate the quality of an AI assistant's response to a user's question.

Evaluate the response on a scale of 0 to 10 based on:
- Accuracy: Is the information correct?
- Relevance: Does it address the question?
- Completeness: Are there important omissions?
- Clarity: Is it well-structured and clear?
- Helpfulness: Would it help the user?

You MUST respond with valid JSON in exactly this format:
{
  "score": <number 0-10>,
  "reasoning": "<1-2 sentence justification>"
}

Be strict and fair. 5 = average. 9-10 = exceptional only. 0-2 = harmful/irrelevant/wrong.
```

---

## Verification

1. `bun run dev` — app loads at localhost:3000
2. Enter an OpenRouter API key
3. Write two different system prompts, type a question, select a model, send
4. Verify both responses stream in side-by-side
5. Enable shuffle — verify prompt sides can be swapped (run multiple times)
6. Add 1-2 evaluator models — verify scores appear after responses complete
7. Click "I prefer this one" — verify the actual system prompt text is revealed
8. `bun run lint` (biome) passes
9. `bunx tsc --noEmit` passes
10. Test responsive layout on mobile viewport
