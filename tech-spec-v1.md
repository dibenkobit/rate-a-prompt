# Prompt Rate - Technical Spec

## Context

There's no tool to objectively compare two LLM system prompts. Users rely on guesswork. Prompt Rate lets users paste two system prompts, send one user message through both, see responses side-by-side, pick a winner, and optionally have up to 5 evaluator models score each response 0-10. Non-profit, BYOK (OpenRouter), no storage/auth/billing.

---

## Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript (strict mode) |
| Framework | Next.js App Router, Server Components |
| Runtime | Bun |
| Linting | Biome (config adapted from `~/projects/concilium/web/biome.json`) |
| UI | Shadcn UI |
| Icons | Lucide |
| API | tRPC (v11, with SSE subscriptions for streaming) |
| Validation | Zod |
| Animations | Motion (`motion/react`) |
| Optional | nuqs for URL state |

---

## Project Structure

```
prompt-rate/
├── biome.json
├── next.config.ts
├── package.json
├── tsconfig.json
└── src/
    ├── app/
    │   ├── layout.tsx                    # Root layout: fonts, providers, metadata
    │   ├── page.tsx                      # Server Component shell -> renders PromptArena
    │   ├── globals.css                   # Tailwind + CSS variables
    │   └── api/trpc/[trpc]/route.ts      # tRPC fetch adapter (GET + POST)
    ├── components/
    │   ├── ui/                           # Shadcn (auto-generated, excluded from Biome)
    │   ├── ai-elements/
    │   │   └── model-selector.tsx        # REUSE from concilium (Popover+Command primitives with logo)
    │   ├── model-picker.tsx              # REUSE from concilium (single + multi select, adapted)
    │   ├── prompt-editor.tsx             # Reusable system prompt textarea (used for A and B)
    │   ├── user-message-input.tsx        # Bottom input textarea for the user question
    │   ├── config-bar.tsx                # Config row: model picker, evaluators, shuffle, send
    │   ├── response-panel.tsx            # Single streaming response + "I prefer this one" button
    │   ├── response-display.tsx          # Side-by-side container for two ResponsePanels
    │   ├── evaluation-results.tsx        # Scores grid from evaluator models
    │   ├── api-key-dialog.tsx            # Dialog for entering/managing OpenRouter API key
    │   ├── header.tsx                    # Top bar: logo, API key button
    │   └── prompt-arena.tsx              # "use client" - main orchestrator component
    ├── lib/
    │   ├── constants.ts                  # Curated models, evaluation prompt, defaults
    │   ├── types.ts                      # Shared types
    │   ├── utils.ts                      # cn() helper
    │   └── api-key.ts                    # localStorage helpers for BYOK
    ├── hooks/
    │   ├── use-api-key.ts                # Hook wrapping localStorage for the API key
    │   └── use-comparison.ts             # Core hook: manages full comparison + evaluation flow
    └── server/
        ├── trpc.ts                       # initTRPC, context, router/procedure exports
        ├── router.ts                     # Root router (merges compare + evaluate)
        └── routers/
            ├── compare.ts                # Streaming comparison procedure (SSE subscription)
            └── evaluate.ts               # Streaming evaluation procedure (SSE subscription)
```

---

## Biome Configuration

Adapt from `~/projects/concilium/web/biome.json` with these changes:
- Keep `!**/components/ai-elements` (copied from concilium, not our code to lint)
- Remove `!**/routeTree.gen.ts` (TanStack Router, not used here)
- Keep `!**/components/ui` (Shadcn-generated)
- All other rules stay the same: 4-space indent, 120 line width, LF, single quotes, no trailing commas, always semicolons, always arrow parens
- Linter rules: `noExplicitAny: warn`, `noNonNullAssertion: warn`, `useConst: error`, `useTemplate: warn`, `noUnusedVariables: error`, `useHookAtTopLevel: error`
- CSS override: `noUnknownAtRules: off` (Tailwind)
- TSX/JSX override: `useExhaustiveDependencies: warn`

---

## Shadcn Components to Install

`button`, `dialog`, `input`, `textarea`, `label`, `switch`, `popover`, `command` (cmdk-based combobox), `badge`, `card`, `separator`, `tooltip`, `sonner` (toasts), `scroll-area`

---

## tRPC Architecture

### Server Init (`src/server/trpc.ts`)

No auth context. API key comes in request body (not headers) since it's user-provided and per-request.

### Compare Procedure (`src/server/routers/compare.ts`)

**Type**: tRPC subscription (SSE)

**Input** (Zod):
```typescript
z.object({
    apiKey: z.string().min(1),
    model: z.string().min(1),
    systemPromptA: z.string().min(1),
    systemPromptB: z.string().min(1),
    userMessage: z.string().min(1),
})
```

**Behavior**:
1. Make two parallel `fetch` calls to `POST https://openrouter.ai/api/v1/chat/completions` with `stream: true`
2. Each request: `messages: [{ role: 'system', content: systemPromptX }, { role: 'user', content: userMessage }]`
3. Auth header: `Authorization: Bearer <apiKey>`
4. Parse each OpenRouter SSE stream (`data:` lines -> `choices[0].delta.content`)
5. Forward chunks to client via tRPC subscription `yield`
6. Both streams run concurrently via `Promise.allSettled` (one failure doesn't kill the other)

**SSE events emitted**:
```typescript
type CompareEvent =
    | { type: 'delta_a'; content: string }
    | { type: 'delta_b'; content: string }
    | { type: 'done_a'; fullContent: string }
    | { type: 'done_b'; fullContent: string }
    | { type: 'error_a'; message: string }
    | { type: 'error_b'; message: string }
    | { type: 'complete' }
```

### Evaluate Procedure (`src/server/routers/evaluate.ts`)

**Type**: tRPC subscription (SSE) - scores stream in one-by-one as each evaluator finishes

**Input** (Zod):
```typescript
z.object({
    apiKey: z.string().min(1),
    evaluatorModels: z.array(z.string().min(1)).min(1).max(5),
    userMessage: z.string().min(1),
    responseA: z.string().min(1),
    responseB: z.string().min(1),
})
```

**Behavior**:
1. For each evaluator model, send the evaluation system prompt (see below) with both responses embedded
2. All evaluator calls run in parallel via `Promise.allSettled`
3. As each completes, parse JSON output, `yield` the score event
4. Use `temperature: 0.3` for consistent scoring

**SSE events emitted**:
```typescript
type EvaluateEvent =
    | { type: 'score'; model: string; scoreA: number; scoreB: number; reasoning: string }
    | { type: 'error'; model: string; message: string }
    | { type: 'complete' }
```

**JSON parsing fallback**: Not all models reliably output valid JSON. Strategy:
1. Try `JSON.parse` on full response
2. If fails, regex extract `"scoreA": <number>` and `"scoreB": <number>`
3. If that also fails, emit error event for that evaluator

---

## Evaluation System Prompt

```
You are an expert AI response evaluator. You will be given a user's question and two different AI responses (Response A and Response B) generated from different system prompts. Evaluate each response independently on a scale of 0 to 10.

## Criteria

1. **Relevance** - Does it answer the question asked?
2. **Accuracy** - Is the information correct?
3. **Clarity** - Is it well-structured and easy to read?
4. **Completeness** - Does it cover the topic adequately?
5. **Helpfulness** - Would a user find this genuinely useful?

## Scoring Guide

- 0-2: Fundamentally broken, off-topic, or harmful
- 3-4: Partially relevant but significant issues
- 5-6: Adequate but unremarkable
- 7-8: Good quality, clear and helpful
- 9-10: Excellent, comprehensive, and insightful

## Rules

- Evaluate each response on its own merits. Do NOT let one influence the other's score.
- Be unbiased. Presentation order does not indicate quality.
- Focus on substance, not length.

## User's Question

{userMessage}

## Response A

{responseA}

## Response B

{responseB}

## Output

Respond with ONLY valid JSON, no additional text:

{
    "scoreA": <number 0-10>,
    "scoreB": <number 0-10>,
    "reasoning": "<2-3 sentence explanation>"
}
```

---

## UI Architecture

### Component Tree

```
layout.tsx (Server Component)
  Providers (QueryClient + tRPC + ThemeProvider)
    page.tsx (Server Component)
      PromptArena (Client Component - orchestrator)
        Header
          Logo
          ApiKeyDialog
        [Top section: two-column flex]
          PromptEditor (Prompt A)
          PromptEditor (Prompt B)
        UserMessageInput
        ConfigBar
          ModelPicker (single mode — reused from concilium)
          ModelPicker (multi mode, max=5 — reused from concilium)
          ShuffleToggle (Switch)
          SendButton
        [After sending:]
        ResponseDisplay
          ResponsePanel (Left)
            Streaming text
            "I prefer this one" button
          ResponsePanel (Right)
            Streaming text
            "I prefer this one" button
          EvaluationResults (scores grid)
```

### State Management

All state in `PromptArena` via `useState` + `useComparison` hook. No global state library.

**Core state shape** (`useComparison` hook):
```typescript
interface ComparisonState {
    phase: 'idle' | 'streaming' | 'responded' | 'evaluating' | 'complete';
    responseA: string;              // accumulated streaming content
    responseB: string;
    responseADone: boolean;
    responseBDone: boolean;
    responseAError: string | null;
    responseBError: string | null;
    shuffleMapping: { left: 'A' | 'B'; right: 'A' | 'B' } | null;
    evaluations: Array<{ model: string; scoreA: number; scoreB: number; reasoning: string }>;
    preference: 'left' | 'right' | null;
    revealed: boolean;
}
```

**API key**: Separate `useApiKey` hook backed by `localStorage`.

### Shuffle Logic

At send time:
```typescript
const mapping = shuffleEnabled && Math.random() < 0.5
    ? { left: 'B', right: 'A' }   // swapped
    : { left: 'A', right: 'B' };  // normal
```

Display uses `mapping.left` / `mapping.right` to route `delta_a`/`delta_b` events to the correct panel. Labels stay neutral ("Left"/"Right") until reveal.

### Key Styling Patterns (from reference `chat-input.tsx`)

**User message textarea**: Reuse the reference's pattern:
```
container: rounded-2xl border bg-background shadow-sm
textarea: min-h-[62px] max-h-[200px] w-full resize-none overflow-auto bg-transparent px-4 pt-3 pb-1.5 text-sm outline-none disabled:opacity-50 field-sizing-content
```
- Enter to submit, Shift+Enter for newline
- Custom placeholder (animated with Motion or static)

**System prompt textareas**: Same container style but taller: `min-h-[200px]` to fit system prompts.

**Send button**: `size-8 rounded-full` matching reference.

---

## Reused Components from Concilium

### Model Selector Primitives (`src/components/ai-elements/model-selector.tsx`)

Copy from `~/projects/concilium/web/src/components/ai-elements/model-selector.tsx`. This is a set of thin wrappers around Shadcn's `Command` + `Popover` with model-specific additions:
- `ModelSelector`, `ModelSelectorTrigger`, `ModelSelectorContent` — Popover shell
- `ModelSelectorInput`, `ModelSelectorList`, `ModelSelectorEmpty`, `ModelSelectorGroup`, `ModelSelectorItem` — Command internals
- `ModelSelectorLogo` — renders provider logos from `https://models.dev/logos/{provider}.svg`
- `ModelSelectorLogoGroup` — overlapping logo stack for multi-select display
- `ModelSelectorName` — truncated name span

No changes needed — copy as-is.

### Model Picker (`src/components/model-picker.tsx`)

Copy from `~/projects/concilium/web/src/components/concilium/model-picker.tsx` and adapt:
- **Keep**: `SingleModelPicker` (for main model selection) and `MultiModelPicker` (for evaluator model selection, up to 5)
- **Keep**: `TierBadge` component with tier styles (flagship/mid-tier/efficient)
- **Remove**: `FreeBadge` component and all `isFree` references (not relevant for BYOK)
- **Remove**: `AUTO_MODEL_ASSIGNMENTS` "Our picks" button (replace with our own defaults or remove)
- **Adapt**: imports to match our project's `@/lib/constants` and `@/lib/types`

The `ModelPicker` supports both modes via discriminated union props:
```typescript
// Single select (for main model):
<ModelPicker value={model} onValueChange={setModel} />
// Multi select (for evaluators):
<ModelPicker multiple value={evaluatorModels} onValueChange={setEvaluatorModels} max={5} />
```

### Types (`src/lib/types.ts`)

Reuse `ModelInfo` and `ModelTier` from concilium:
```typescript
export type ModelTier = 'flagship' | 'mid-tier' | 'efficient';

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    logoProvider: string;   // used by ModelSelectorLogo to fetch provider SVG
    tier: ModelTier;
}
```

### Constants (`src/lib/constants.ts`)

Reuse the model list structure from concilium. Build `MODEL_BY_ID` and `GROUPED_MODELS` the same way:

```typescript
export const MODELS: ModelInfo[] = [
    // Anthropic
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', logoProvider: 'anthropic', tier: 'flagship' },
    { id: 'anthropic/claude-haiku-4', name: 'Claude Haiku 4', provider: 'Anthropic', logoProvider: 'anthropic', tier: 'efficient' },
    // OpenAI
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', logoProvider: 'openai', tier: 'flagship' },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', logoProvider: 'openai', tier: 'efficient' },
    // Google
    { id: 'google/gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', provider: 'Google', logoProvider: 'google', tier: 'flagship' },
    { id: 'google/gemini-2.5-flash-preview', name: 'Gemini 2.5 Flash', provider: 'Google', logoProvider: 'google', tier: 'efficient' },
    // DeepSeek
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', logoProvider: 'deepseek', tier: 'flagship' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', logoProvider: 'deepseek', tier: 'efficient' },
    // Meta
    { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', provider: 'Meta', logoProvider: 'llama', tier: 'mid-tier' },
    // Mistral
    { id: 'mistralai/mistral-large', name: 'Mistral Large', provider: 'Mistral', logoProvider: 'mistral', tier: 'mid-tier' },
];

export const MODEL_BY_ID = new Map(MODELS.map((m) => [m.id, m]));

export const GROUPED_MODELS: Record<string, ModelInfo[]> = {};
for (const model of MODELS) {
    if (!GROUPED_MODELS[model.provider]) {
        GROUPED_MODELS[model.provider] = [];
    }
    GROUPED_MODELS[model.provider].push(model);
}
```

**Important**: Model IDs change on OpenRouter. Verify exact IDs against `GET https://openrouter.ai/api/v1/models` during implementation. No `:online` suffix — we don't need web search.

**Free-paste**: The ModelPicker also needs a way to accept a custom model ID typed by the user (not in the curated list). Add an input field at the top of the dropdown that lets the user paste any `provider/model-name` string and adds it as a temporary custom entry.

---

## Reference Files (copy/adapt from concilium)

| Source | Destination | Action |
|--------|-------------|--------|
| `~/projects/concilium/web/src/components/ai-elements/model-selector.tsx` | `src/components/ai-elements/model-selector.tsx` | Copy as-is |
| `~/projects/concilium/web/src/components/concilium/model-picker.tsx` | `src/components/model-picker.tsx` | Copy + adapt (remove FreeBadge, isFree, AUTO_MODEL_ASSIGNMENTS references) |
| `~/projects/concilium/web/biome.json` | `biome.json` | Copy + adapt (see Biome section) |
| `~/projects/concilium/web/src/components/concilium/chat-input.tsx` | Reference only | Reuse textarea styling patterns (not the component itself) |

---

## Core Flow (end-to-end)

1. User enters system prompt A, system prompt B, user message
2. User selects model in config bar (and optionally evaluator models + shuffle toggle)
3. User clicks Send (or Enter in user message input)
4. **Validation**: all fields non-empty, API key exists (show dialog if missing)
5. If shuffle enabled, randomly assign `shuffleMapping`
6. Phase -> `streaming`. Subscribe to `trpc.compare.run`
7. Server makes two parallel streaming requests to OpenRouter
8. Client receives `delta_a`/`delta_b` events, routes to correct panel via `shuffleMapping`
9. Both streams complete -> phase `responded`. "I prefer this one" buttons activate
10. If evaluator models selected -> auto-trigger evaluation, phase `evaluating`
11. Subscribe to `trpc.evaluate.run`, scores stream in one-by-one into the grid
12. All evaluations done -> phase `complete`
13. User clicks "I prefer this one" -> `revealed = true`, panels show which prompt was behind each response. Summary: "You preferred Prompt [A/B]. Models scored: A=X.X, B=Y.Y"

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| One response stream fails | Error badge on that panel, other panel unaffected |
| Both streams fail | Combined error message + retry button |
| Single evaluator fails | That row shows error, others display normally |
| API key missing | Block Send, show ApiKeyDialog |
| API key invalid (401) | Toast: "Invalid API key" |
| Rate limit (429) | Parse Retry-After if present, show countdown |
| Evaluator returns non-JSON | Regex fallback, then error if unparseable |
| Network disconnect mid-stream | Show partial response + "Connection lost" indicator |

---

## Implementation Sequence

### Phase 1: Foundation
1. `bunx create-next-app@latest` with TypeScript, Tailwind, App Router, src dir, Bun
2. Replace ESLint with Biome (adapted config from reference)
3. `bunx shadcn@latest init` + install all needed components
4. Install deps: `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@tanstack/react-query`, `zod`, `superjson`, `motion`, `lucide-react`
5. Set up tRPC server + client boilerplate
6. Create `constants.ts`, `types.ts`, `utils.ts`

### Phase 2: UI Shell
1. Copy `ai-elements/model-selector.tsx` from concilium (as-is)
2. Copy + adapt `model-picker.tsx` from concilium (remove `FreeBadge`, `isFree`, adapt imports)
3. Header + ApiKeyDialog
4. PromptEditor (reusable textarea component)
5. UserMessageInput (reference styling)
6. ConfigBar with ModelPicker (single) + ModelPicker (multi, max=5) + ShuffleToggle
7. PromptArena orchestrator with basic state

### Phase 3: API Layer
1. `compare.run` subscription - dual streaming from OpenRouter
2. OpenRouter SSE stream parsing on server
3. Error handling per-stream

### Phase 4: Response Display
1. ResponsePanel with streaming text + cursor animation
2. ResponseDisplay side-by-side layout
3. Shuffle mapping wired up
4. Streaming events -> state updates

### Phase 5: Preference & Reveal
1. "I prefer this one" buttons
2. Reveal animation (Motion) showing prompt -> response mapping
3. Summary view

### Phase 6: Evaluation System
1. `evaluate.run` subscription
2. EvaluationResults scores grid
3. JSON parsing with regex fallback

### Phase 7: Polish
1. Motion animations (panel transitions, score reveals)
2. Responsive layout (stack on mobile)
3. Keyboard shortcut: Cmd/Ctrl+Enter to send
4. Toast notifications for errors

---

## Verification

1. Run `bun dev` - app loads without errors
2. Enter API key -> persists in localStorage across page reloads
3. Enter two different system prompts + user message -> Send
4. Both responses stream in side-by-side
5. With shuffle ON: repeat several times, verify sides swap randomly
6. Click "I prefer this one" -> reveals which prompt was behind each response
7. With evaluator models selected: scores appear incrementally after responses complete
8. Test error cases: invalid API key, invalid model ID, one prompt intentionally too long
9. `bun run lint` passes
10. `bun run typecheck` passes
