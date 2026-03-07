# Error Handling Design

## Problem

1. Model evaluations get stuck in infinite loading (skeleton never resolves)
2. OpenRouter API errors are swallowed — evaluations run on error text
3. No server-side logging — errors vanish silently
4. Users see generic "Failed" text with no actionable information
5. No way to retry individual failed operations

## Approach: Minimal — Fix Error Propagation

Fix the existing code so errors flow from server to client to UI. No new abstractions.

## Data Model Changes

Add `error` field to `ResponseState`:

```typescript
export interface ResponseState {
    content: string;
    done: boolean;
    error: string | null; // null = no error, string = error message
    evaluations: EvaluationResult[];
}
```

`EvaluationResult` unchanged — `score: -1` already signals failure. Pass real error message as `reasoning` instead of generic "Evaluation failed".

## Server-Side Changes

### tRPC error formatter (`src/trpc/init.ts`)

Add custom error formatter to expose error messages to the client. tRPC strips internal messages in production by default — our messages are user-facing (e.g., "OpenRouter error: 429 Rate limited").

### Console logging (`completion.ts`, `evaluation.ts`)

Add `console.error` with structured context before throwing:

```
[completion] OpenRouter error 429 | model=anthropic/claude-3.5-sonnet | Rate limit exceeded
[evaluation] Parse error | model=openai/gpt-4o | raw=<truncated>
```

### Fetch timeout (30s)

Add `AbortSignal.timeout(30000)` to OpenRouter `fetch` calls. On timeout, throw `TRPCError` with `TIMEOUT` code and clear message.

### Streaming error propagation (`completion.ts`)

If an SSE chunk contains an OpenRouter error object, yield an error event instead of silently skipping.

## Client-Side Changes

### `comparison-workbench.tsx` — `streamResponse`

- Extract actual error message from tRPC error
- Set `response.error` instead of putting error text in `content`
- Return `null` on error (prevents evaluation of failed responses — already works)

### `comparison-workbench.tsx` — `runEvaluations`

- Extract real error message in `.catch()` and pass as `reasoning`

### Retry support

Two callbacks flowing through `ResponsePair` -> `ResponsePanel`:

- `onRetryResponse(index)` — re-runs `streamResponse` for that card
- `onRetryEvaluation(index, evaluatorModel)` — re-runs the single failed evaluation

## UI Changes

### `response-panel.tsx`

When `response.error` is set:

- Red/destructive inline error with `AlertCircle` icon
- Actual error message displayed
- "Retry" button

### `evaluation-results.tsx`

When evaluation has `score: -1`:

- Tooltip shows real error message (from `reasoning`)
- Small retry icon button next to "Failed"

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `error: string \| null` to `ResponseState` |
| `src/trpc/init.ts` | Add error formatter |
| `src/trpc/routers/completion.ts` | Logging, timeout, stream error propagation |
| `src/trpc/routers/evaluation.ts` | Logging, timeout |
| `src/trpc/client.tsx` | No changes needed |
| `src/components/comparison-workbench.tsx` | Error extraction, retry callbacks |
| `src/components/response-pair.tsx` | Pass retry callbacks through |
| `src/components/response-panel.tsx` | Inline error state with retry |
| `src/components/evaluation-results.tsx` | Retry button on failed evaluations |
