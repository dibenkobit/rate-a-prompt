# UX Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the UX of Rate a Prompt with 7 targeted polish improvements.

**Architecture:** All changes are in existing React components. No new dependencies, no new pages, no backend changes. Add response timing to state, replace tooltip-based evaluation reasoning with expandable inline display, and improve keyboard/accessibility throughout.

**Tech Stack:** React 19, motion (framer-motion), Tailwind CSS v4, lucide-react icons

**Verification:** `bun run lint` and `bun run build` after each task.

---

### Task 1: Auto-scroll to responses when streaming starts

**Files:**
- Modify: `src/components/comparison-workbench.tsx`

**Step 1: Add ref and scroll behavior**

Add a `useRef` for the response section and scroll into view when phase becomes `'streaming'`:

```tsx
// Add to imports
import { useCallback, useEffect, useRef, useState } from 'react';

// Add ref near other refs
const responseSectionRef = useRef<HTMLDivElement>(null);

// Add useEffect after state declaration
useEffect(() => {
    if (state.phase === 'streaming') {
        responseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}, [state.phase]);
```

Attach the ref to the `<motion.div>` wrapping the response section:

```tsx
<motion.div ref={responseSectionRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-4'>
```

**Step 2: Verify**

Run: `bun run lint && bun run build`

**Step 3: Commit**

```bash
git add src/components/comparison-workbench.tsx
git commit -m "feat: auto-scroll to responses when streaming starts"
```

---

### Task 2: Response timing

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `src/components/comparison-workbench.tsx`
- Modify: `src/components/response-panel.tsx`

**Step 1: Add timing fields to ResponseState**

In `src/lib/types.ts`, add `startedAt` and `completedAt`:

```ts
export interface ResponseState {
    content: string;
    done: boolean;
    error: string | null;
    evaluations: EvaluationResult[];
    startedAt: number | null;
    completedAt: number | null;
}
```

**Step 2: Update emptyResponse and streamResponse in comparison-workbench.tsx**

Update `emptyResponse`:

```tsx
const emptyResponse: ResponseState = { content: '', done: false, error: null, evaluations: [], startedAt: null, completedAt: null };
```

In `handleSend`, after creating initial responses, set `startedAt` on each response when streaming begins. Simplest approach: set `startedAt: Date.now()` in `makeInitialResponses` is wrong because they haven't started yet. Instead, set it at the start of `streamResponse`:

At the top of `streamResponse`, add:

```tsx
async function streamResponse(index: number, model: string, systemPrompt: string, userMessage: string): Promise<string | null> {
    setState((prev) => {
        const responses = [...prev.responses];
        responses[index] = { ...responses[index], startedAt: Date.now() };
        return { ...prev, responses };
    });

    try {
        // ... existing code
    }
```

When marking done (both success and error), set `completedAt: Date.now()`:

Success path (line ~145-150):
```tsx
setState((prev) => {
    const responses = [...prev.responses];
    responses[index] = { ...responses[index], done: true, completedAt: Date.now() };
    return { ...prev, responses };
});
```

Error path (line ~137-141):
```tsx
setState((prev) => {
    const responses = [...prev.responses];
    responses[index] = { ...responses[index], error: message, done: true, completedAt: Date.now() };
    return { ...prev, responses };
});
```

**Step 3: Display timing in response-panel.tsx**

Add a duration display in the header, next to the "Complete" text:

```tsx
// Compute duration inside the component
const duration = done && startedAt && completedAt
    ? ((completedAt - startedAt) / 1000).toFixed(1)
    : null;
```

Replace the "Complete" span:
```tsx
{done && !isStreaming && !error && phase !== 'editing' && (
    <span className='text-xs text-muted-foreground'>
        {duration ? `${duration}s` : 'Complete'}
    </span>
)}
```

Add `startedAt` and `completedAt` to the props interface and destructuring.

**Step 4: Pass timing props from response-pair.tsx**

In `response-pair.tsx`, pass the new props:
```tsx
startedAt={response.startedAt}
completedAt={response.completedAt}
```

**Step 5: Verify**

Run: `bun run lint && bun run build`

**Step 6: Commit**

```bash
git add src/lib/types.ts src/components/comparison-workbench.tsx src/components/response-panel.tsx src/components/response-pair.tsx
git commit -m "feat: show response generation time in panel header"
```

---

### Task 3: Expandable evaluation reasoning

**Files:**
- Modify: `src/components/evaluation-results.tsx`

**Step 1: Replace tooltip with click-to-expand**

Remove Tooltip imports. Add `useState` for tracking expanded evaluation. Replace the Tooltip wrapper with a clickable div that expands reasoning below.

Full replacement for `evaluation-results.tsx`:

```tsx
'use client';

import { ChevronDownIcon, RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { getModelDisplay } from '@/lib/constants';
import type { EvaluationResult } from '@/lib/types';

interface EvaluationResultsProps {
    evaluations: EvaluationResult[];
    expectedCount: number;
    loading: boolean;
    onRetryEvaluation: (evaluatorModel: string) => void;
}

function scoreColor(score: number): string {
    if (score < 0) return 'text-muted-foreground';
    if (score >= 8) return 'text-emerald-500';
    if (score >= 5) return 'text-amber-500';
    return 'text-red-500';
}

export function EvaluationResults({ evaluations, expectedCount, loading, onRetryEvaluation }: EvaluationResultsProps) {
    const [expanded, setExpanded] = useState<string | null>(null);

    if (expectedCount === 0) return null;

    const validScores = evaluations.filter((e) => e.score >= 0);
    const avg = validScores.length > 0 ? validScores.reduce((sum, e) => sum + e.score, 0) / validScores.length : null;

    return (
        <div className='space-y-2'>
            <div className='flex items-center justify-between'>
                <span className='text-xs font-medium text-muted-foreground'>Evaluations</span>
                {avg !== null && (
                    <span className={`text-xs font-semibold ${scoreColor(avg)}`}>Avg: {avg.toFixed(1)}/10</span>
                )}
            </div>
            <div className='grid grid-cols-1 gap-1.5'>
                <AnimatePresence mode='popLayout'>
                    {evaluations.map((evaluation, i) => {
                        const display = getModelDisplay(evaluation.evaluatorModel);
                        const isExpanded = expanded === evaluation.evaluatorModel;
                        return (
                            <motion.div
                                key={evaluation.evaluatorModel}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className='overflow-hidden rounded-md border'
                            >
                                <button
                                    type='button'
                                    className='flex w-full items-center justify-between px-2.5 py-1.5 text-left hover:bg-muted/50'
                                    onClick={() => setExpanded(isExpanded ? null : evaluation.evaluatorModel)}
                                    aria-expanded={isExpanded}
                                    aria-label={`${display.name} evaluation details`}
                                >
                                    <span className='flex items-center gap-1.5'>
                                        <ChevronDownIcon
                                            className={`size-3 text-muted-foreground transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                        />
                                        <span className='truncate text-xs'>{display.name}</span>
                                    </span>
                                    <span className={`text-xs font-semibold ${scoreColor(evaluation.score)}`}>
                                        {evaluation.score >= 0 ? (
                                            `${evaluation.score}/10`
                                        ) : (
                                            <span className='flex items-center gap-1'>
                                                Failed
                                                <span
                                                    role='button'
                                                    tabIndex={0}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRetryEvaluation(evaluation.evaluatorModel);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.stopPropagation();
                                                            onRetryEvaluation(evaluation.evaluatorModel);
                                                        }
                                                    }}
                                                    className='rounded p-0.5 hover:bg-muted'
                                                    aria-label={`Retry ${display.name} evaluation`}
                                                >
                                                    <RotateCcwIcon className='size-3' />
                                                </span>
                                            </span>
                                        )}
                                    </span>
                                </button>
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className='overflow-hidden'
                                        >
                                            <p className='border-t px-2.5 py-2 text-xs leading-relaxed text-muted-foreground'>
                                                {evaluation.reasoning}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                {loading &&
                    Array.from({ length: expectedCount - evaluations.length }, (_, i) => `skeleton-${i}`).map((key) => (
                        <Skeleton key={key} className='h-8 w-full rounded-md' />
                    ))}
            </div>
        </div>
    );
}
```

**Step 2: Verify**

Run: `bun run lint && bun run build`

**Step 3: Commit**

```bash
git add src/components/evaluation-results.tsx
git commit -m "feat: replace evaluation tooltip with expandable inline reasoning"
```

---

### Task 4: Allow preference during streaming

**Files:**
- Modify: `src/components/response-pair.tsx`
- Modify: `src/components/response-panel.tsx`

**Step 1: Update showPreferButton logic in response-pair.tsx**

Change the condition so the button shows as soon as any content exists and we're not in editing phase:

```tsx
showPreferButton={
    (phase === 'streaming' || phase === 'responded') &&
    preference === null &&
    response.content.length > 0
}
```

**Step 2: Update response-panel.tsx**

Remove the `done` guard on the prefer button rendering (line 104):

```tsx
{showPreferButton && (
    <Button variant='outline' size='sm' className='w-full gap-1.5' onClick={onPrefer}>
        <CheckCircleIcon className='size-3.5' />I prefer this one
    </Button>
)}
```

**Step 3: Handle phase transition when preference is set during streaming**

In `comparison-workbench.tsx`, the `onPrefer` handler sets phase to `'revealed'`. This is fine even during streaming — the responses will continue streaming, and the prompts are revealed. No change needed.

**Step 4: Verify**

Run: `bun run lint && bun run build`

**Step 5: Commit**

```bash
git add src/components/response-pair.tsx src/components/response-panel.tsx
git commit -m "feat: allow selecting preference while responses are still streaming"
```

---

### Task 5: Keyboard shortcut hint + Escape to reset

**Files:**
- Modify: `src/components/user-input.tsx`
- Modify: `src/components/comparison-workbench.tsx`

**Step 1: Add keyboard shortcut hint to Send button**

In `user-input.tsx`, update the Send button:

```tsx
<Button size='sm' className='gap-1.5' onClick={onSend} disabled={disabled || !value.trim()}>
    <SendIcon className='size-3.5' />
    Send
    <kbd className='pointer-events-none ml-1 hidden rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground sm:inline'>
        ⏎
    </kbd>
</Button>
```

**Step 2: Add Escape to reset in comparison-workbench.tsx**

Add a `useEffect` for global keydown:

```tsx
useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && (state.phase === 'responded' || state.phase === 'revealed')) {
            handleReset();
        }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [state.phase]);
```

Note: `handleReset` is a regular function and will be stable within each render. The effect re-registers on phase change which is fine.

**Step 3: Verify**

Run: `bun run lint && bun run build`

**Step 4: Commit**

```bash
git add src/components/user-input.tsx src/components/comparison-workbench.tsx
git commit -m "feat: add keyboard shortcut hint on Send and Escape to reset"
```

---

### Task 6: Accessibility pass

**Files:**
- Modify: `src/components/response-panel.tsx`
- Modify: `src/components/prompt-editor.tsx`
- Modify: `src/components/config-panel.tsx`

**Step 1: Add aria-label to retry button in response-panel.tsx**

The Retry button in the error state already has text "Retry" so it's fine. But add aria-label to the "I prefer this one" button for clarity:

```tsx
<Button variant='outline' size='sm' className='w-full gap-1.5' onClick={onPrefer} aria-label='Prefer this response'>
```

**Step 2: Add aria-label to remove prompt button in prompt-editor.tsx**

```tsx
<Button variant='ghost' size='icon' className='size-6' onClick={onRemove} aria-label={`Remove ${label}`}>
```

**Step 3: Add aria-labels to config panel switches**

In `config-panel.tsx`, add aria-label to both Switch components:

```tsx
<Switch checked={shuffle} onCheckedChange={onShuffleChange} disabled={disabled} aria-label='Shuffle prompt order' />
```

```tsx
<Switch checked={webSearch} onCheckedChange={onWebSearchChange} disabled={disabled} aria-label='Enable web search' />
```

**Step 4: Verify**

Run: `bun run lint && bun run build`

**Step 5: Commit**

```bash
git add src/components/response-panel.tsx src/components/prompt-editor.tsx src/components/config-panel.tsx
git commit -m "feat: add aria-labels to icon-only buttons for accessibility"
```

---

### Task 7: Better retry/reset buttons

**Files:**
- Modify: `src/components/response-panel.tsx`
- Modify: `src/components/comparison-workbench.tsx`

**Step 1: Add retry icon to response panel header**

In the response panel header (between the "Response N" label and status indicator), add a retry button that shows when the response is done and the phase is `responded` or `revealed`:

```tsx
<div className='flex items-center gap-2'>
    {done && !error && (phase === 'responded' || phase === 'revealed') && (
        <button
            type='button'
            onClick={onRetryResponse}
            className='rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground'
            aria-label={`Retry response ${index + 1}`}
        >
            <RotateCcwIcon className='size-3' />
        </button>
    )}
    {/* existing status indicators */}
</div>
```

The header div needs to wrap the right-side elements. Update the header structure.

**Step 2: Rename "Try Again" to "New Comparison" in comparison-workbench.tsx**

```tsx
<Button variant='outline' size='sm' className='gap-1.5' onClick={handleReset}>
    <RotateCcwIcon className='size-3.5' />
    New Comparison
</Button>
```

Add Escape hint:
```tsx
<Button variant='outline' size='sm' className='gap-1.5' onClick={handleReset}>
    <RotateCcwIcon className='size-3.5' />
    New Comparison
    <kbd className='pointer-events-none ml-1 hidden rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground sm:inline'>
        Esc
    </kbd>
</Button>
```

**Step 3: Verify**

Run: `bun run lint && bun run build`

**Step 4: Commit**

```bash
git add src/components/response-panel.tsx src/components/comparison-workbench.tsx
git commit -m "feat: add per-response retry and rename reset to New Comparison"
```
