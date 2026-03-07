# Error Handling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix error handling so errors flow from server to client UI with real messages, logging, timeouts, and retry buttons.

**Architecture:** Add tRPC error formatter to expose messages, add console.error logging and fetch timeouts on server, propagate real error messages to client, show inline error states with retry buttons in response/evaluation cards.

**Tech Stack:** tRPC v11, React 19, Next.js 16, Tailwind CSS v4, Lucide icons

---

### Task 1: Add `error` field to `ResponseState` type

**Files:**
- Modify: `src/lib/types.ts:23-27`

**Step 1: Add error field**

```typescript
export interface ResponseState {
    content: string;
    done: boolean;
    error: string | null;
    evaluations: EvaluationResult[];
}
```

**Step 2: Update `emptyResponse` in comparison-workbench.tsx**

File: `src/components/comparison-workbench.tsx:30`

```typescript
const emptyResponse: ResponseState = { content: '', done: false, error: null, evaluations: [] };
```

**Step 3: Verify**

Run: `bun run lint && bun run build`
Expected: PASS (error field is optional-ish — existing code doesn't set it yet, but TypeScript will flag missing `error` in object literals)

**Step 4: Commit**

```bash
git add src/lib/types.ts src/components/comparison-workbench.tsx
git commit -m "feat: add error field to ResponseState type"
```

---

### Task 2: Add tRPC error formatter

**Files:**
- Modify: `src/trpc/init.ts:11-13`

**Step 1: Add error formatter to tRPC init**

Replace the `t` initialization with:

```typescript
const t = initTRPC.context<TRPCContext>().create({
    transformer: superjson,
    errorFormatter({ shape, error }) {
        return {
            ...shape,
            message: error.message
        };
    }
});
```

This ensures the server-side error message (e.g., "OpenRouter error: 429 Rate limited") is passed through to the client instead of being stripped.

**Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/trpc/init.ts
git commit -m "feat: add tRPC error formatter to expose error messages"
```

---

### Task 3: Add logging and timeout to evaluation procedure

**Files:**
- Modify: `src/trpc/routers/evaluation.ts`

**Step 1: Add fetch timeout**

Add `signal: AbortSignal.timeout(30_000)` to the fetch call options.

**Step 2: Add console.error logging before each TRPCError throw**

Before the `!response.ok` throw:
```typescript
console.error(`[evaluation] OpenRouter error ${response.status} | model=${input.model} | ${errorText.slice(0, 200)}`);
```

Before the parse failure throw:
```typescript
console.error(`[evaluation] Parse error | model=${input.model} | raw=${raw.slice(0, 200)}`);
```

**Step 3: Wrap fetch in try/catch for timeout errors**

Wrap the entire fetch + parse logic. In the catch, check for `AbortError` / timeout:

```typescript
if (error instanceof DOMException && error.name === 'AbortError') {
    console.error(`[evaluation] Timeout after 30s | model=${input.model}`);
    throw new TRPCError({ code: 'TIMEOUT', message: 'Evaluation timed out after 30 seconds' });
}
throw error; // re-throw TRPCErrors
```

**Step 4: Verify**

Run: `bun run lint && bun run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/trpc/routers/evaluation.ts
git commit -m "feat: add logging and timeout to evaluation procedure"
```

---

### Task 4: Add logging, timeout, and stream error detection to completion procedure

**Files:**
- Modify: `src/trpc/routers/completion.ts`

**Step 1: Add fetch timeout**

Add `signal: AbortSignal.timeout(30_000)` to the fetch call options.

**Step 2: Add console.error logging before each TRPCError throw**

Before the `!response.ok` throw:
```typescript
console.error(`[completion] OpenRouter error ${response.status} | model=${input.model} | ${errorText.slice(0, 200)}`);
```

**Step 3: Detect OpenRouter error objects in SSE stream**

In the SSE parsing loop, after `JSON.parse(data)`, check for error objects:

```typescript
const parsed = JSON.parse(data);
if (parsed.error) {
    const msg = typeof parsed.error === 'string' ? parsed.error : parsed.error.message ?? JSON.stringify(parsed.error);
    console.error(`[completion] Stream error | model=${input.model} | ${msg.slice(0, 200)}`);
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `OpenRouter stream error: ${msg}` });
}
```

**Step 4: Wrap the outer fetch in try/catch for timeout**

Same pattern as evaluation — catch `AbortError` and throw `TRPCError` with `TIMEOUT` code.

**Step 5: Verify**

Run: `bun run lint && bun run build`
Expected: PASS

**Step 6: Commit**

```bash
git add src/trpc/routers/completion.ts
git commit -m "feat: add logging, timeout, and stream error detection to completion"
```

---

### Task 5: Propagate real error messages in comparison-workbench client

**Files:**
- Modify: `src/components/comparison-workbench.tsx`

**Step 1: Fix `streamResponse` error handling**

Replace the catch block (lines ~129-138) to extract the real error message and set `response.error`:

```typescript
} catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get response';
    setState((prev) => {
        const responses = [...prev.responses];
        responses[index] = { ...responses[index], error: message };
        return { ...prev, responses };
    });

    setState((prev) => {
        const responses = [...prev.responses];
        responses[index] = { ...responses[index], done: true };
        return { ...prev, responses };
    });
    return null;
}
```

Remove the `let error = false;` variable — no longer needed. Remove the separate `done: true` setState after the try/catch (it's now inside catch, and we need another one for the success path).

Set `done: true` at the end of the try block (success path):
```typescript
setState((prev) => {
    const responses = [...prev.responses];
    responses[index] = { ...responses[index], done: true };
    return { ...prev, responses };
});
return contentRefs.current[index];
```

**Step 2: Fix `runEvaluations` error handling**

In the `.catch()` callback, extract the real error message:

```typescript
.catch((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Evaluation failed';
    setState((prev) => {
        const responses = [...prev.responses];
        responses[i] = {
            ...responses[i],
            evaluations: [
                ...responses[i].evaluations,
                { evaluatorModel, score: -1, reasoning: message }
            ]
        };
        return { ...prev, responses };
    });
})
```

**Step 3: Add retry callbacks**

Add `retryResponse` function:

```typescript
async function retryResponse(index: number) {
    const promptIndex = state.displayOrder[index];
    const model = state.config.webSearch ? `${state.config.model}:online` : state.config.model;

    contentRefs.current[index] = '';
    setState((prev) => {
        const responses = [...prev.responses];
        responses[index] = { ...emptyResponse };
        return { ...prev, responses };
    });

    const content = await streamResponse(index, model, state.prompts[promptIndex], state.userMessage);
    if (content) {
        const evalModels = state.config.webSearch
            ? state.config.evaluatorModels.map((m) => `${m}:online`)
            : state.config.evaluatorModels;
        runEvaluations(state.prompts, state.userMessage, [content], [state.displayOrder[index]], evalModels, index);
    }
}
```

Note: `runEvaluations` needs a small adjustment to accept an optional `startIndex` parameter so retry can target the correct response slot. Update the signature:

```typescript
const runEvaluations = useCallback(
    (
        prompts: string[],
        userMessage: string,
        contents: (string | null)[],
        displayOrder: number[],
        evaluatorModels: string[],
        startIndex = 0
    ) => {
```

And change `responses[i]` to `responses[startIndex + i]` inside the loop.

Add `retryEvaluation` function:

```typescript
function retryEvaluation(responseIndex: number, evaluatorModel: string) {
    const content = contentRefs.current[responseIndex];
    if (!content) return;
    const promptIndex = state.displayOrder[responseIndex];

    // Remove the failed evaluation
    setState((prev) => {
        const responses = [...prev.responses];
        responses[responseIndex] = {
            ...responses[responseIndex],
            evaluations: responses[responseIndex].evaluations.filter((e) => e.evaluatorModel !== evaluatorModel)
        };
        return { ...prev, responses };
    });

    api()
        .evaluation.evaluate.mutate({
            model: evaluatorModel,
            systemPrompt: state.prompts[promptIndex],
            userMessage: state.userMessage,
            response: content
        })
        .then((result) => {
            setState((prev) => {
                const responses = [...prev.responses];
                responses[responseIndex] = {
                    ...responses[responseIndex],
                    evaluations: [...responses[responseIndex].evaluations, { evaluatorModel, ...result }]
                };
                return { ...prev, responses };
            });
        })
        .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Evaluation failed';
            setState((prev) => {
                const responses = [...prev.responses];
                responses[responseIndex] = {
                    ...responses[responseIndex],
                    evaluations: [
                        ...responses[responseIndex].evaluations,
                        { evaluatorModel, score: -1, reasoning: message }
                    ]
                };
                return { ...prev, responses };
            });
        });
}
```

**Step 4: Pass retry callbacks to ResponsePair**

```tsx
<ResponsePair
    responses={state.responses}
    expectedEvalCount={state.config.evaluatorModels.length}
    phase={state.phase}
    preference={state.preference}
    onPrefer={(index) => setState((prev) => ({ ...prev, phase: 'revealed', preference: index }))}
    onRetryResponse={retryResponse}
    onRetryEvaluation={retryEvaluation}
    revealedPrompts={...}
    gridCols={gridCols}
/>
```

**Step 5: Verify**

Run: `bun run lint && bun run build`
Expected: FAIL (ResponsePair doesn't accept new props yet — that's Task 6)

**Step 6: Commit**

```bash
git add src/components/comparison-workbench.tsx
git commit -m "feat: propagate real error messages and add retry callbacks"
```

---

### Task 6: Thread retry callbacks through ResponsePair and ResponsePanel

**Files:**
- Modify: `src/components/response-pair.tsx`
- Modify: `src/components/response-panel.tsx`

**Step 1: Update ResponsePair props and pass through**

Add `onRetryResponse` and `onRetryEvaluation` to the interface and pass to each `ResponsePanel`:

```typescript
interface ResponsePairProps {
    responses: ResponseState[];
    expectedEvalCount: number;
    phase: ComparisonPhase;
    preference: number | null;
    onPrefer: (index: number) => void;
    onRetryResponse: (index: number) => void;
    onRetryEvaluation: (responseIndex: number, evaluatorModel: string) => void;
    revealedPrompts: RevealedPrompt[] | null;
    gridCols: string;
}
```

Pass to `ResponsePanel`:
```tsx
<ResponsePanel
    ...existing props...
    error={response.error}
    onRetryResponse={() => onRetryResponse(i)}
    onRetryEvaluation={(evaluatorModel) => onRetryEvaluation(i, evaluatorModel)}
/>
```

**Step 2: Update ResponsePanel to show error state**

Add to props interface:
```typescript
error: string | null;
onRetryResponse: () => void;
onRetryEvaluation: (evaluatorModel: string) => void;
```

Add imports: `AlertCircleIcon, RotateCcwIcon` from `lucide-react`.

In the content area, when `error` is set, render error state instead of content:

```tsx
{error ? (
    <div className='flex flex-col items-center gap-3 py-8 text-center'>
        <AlertCircleIcon className='size-8 text-red-500' />
        <p className='text-sm text-red-500'>{error}</p>
        <Button variant='outline' size='sm' className='gap-1.5' onClick={onRetryResponse}>
            <RotateCcwIcon className='size-3.5' />
            Retry
        </Button>
    </div>
) : content ? (
    <Streamdown ...>...</Streamdown>
) : (
    <span className='text-muted-foreground italic'>Waiting for response...</span>
)}
```

Pass `onRetryEvaluation` to `EvaluationResults`:
```tsx
<EvaluationResults
    evaluations={evaluations}
    expectedCount={expectedEvalCount}
    loading={evaluating}
    onRetryEvaluation={onRetryEvaluation}
/>
```

**Step 3: Verify**

Run: `bun run lint && bun run build`
Expected: FAIL (EvaluationResults doesn't accept `onRetryEvaluation` yet — that's Task 7)

**Step 4: Commit**

```bash
git add src/components/response-pair.tsx src/components/response-panel.tsx
git commit -m "feat: thread retry callbacks and error state through response components"
```

---

### Task 7: Add retry button to failed evaluations

**Files:**
- Modify: `src/components/evaluation-results.tsx`

**Step 1: Add `onRetryEvaluation` prop**

```typescript
interface EvaluationResultsProps {
    evaluations: EvaluationResult[];
    expectedCount: number;
    loading: boolean;
    onRetryEvaluation: (evaluatorModel: string) => void;
}
```

**Step 2: Add retry button next to failed evaluation scores**

Import `RotateCcwIcon` from `lucide-react`.

For evaluations with `score < 0`, add a clickable retry icon next to the "Failed" text:

```tsx
{evaluation.score >= 0 ? (
    `${evaluation.score}/10`
) : (
    <span className='flex items-center gap-1'>
        Failed
        <button
            type='button'
            onClick={() => onRetryEvaluation(evaluation.evaluatorModel)}
            className='rounded p-0.5 hover:bg-muted'
        >
            <RotateCcwIcon className='size-3' />
        </button>
    </span>
)}
```

**Step 3: Verify**

Run: `bun run lint && bun run build`
Expected: PASS — all types should connect now

**Step 4: Commit**

```bash
git add src/components/evaluation-results.tsx
git commit -m "feat: add retry button to failed evaluations"
```

---

### Task 8: Final verification

**Step 1: Run full lint and build**

```bash
bun run lint && bun run build
```

Expected: PASS with no errors

**Step 2: Manual smoke test**

Start dev server: `bun run dev`
Test scenarios:
1. Invalid API key → should show inline error with real message
2. Normal completion → should work as before
3. If evaluation fails → should show "Failed" with real error in tooltip + retry button

**Step 3: Commit any fixes if needed**
