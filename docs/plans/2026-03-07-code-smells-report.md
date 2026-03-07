# Code Smells Report

Date: 2026-03-07

## Critical

### 1. God Component — `comparison-workbench.tsx`

The `ComparisonWorkbench` component (~400 lines) handles state management, API calls, streaming logic, evaluation logic, UI rendering, and keyboard events. It has 7+ state variables and 5+ major functions mixing business logic with presentation. **Fix:** Extract custom hooks (`useStreaming`, `useEvaluation`, `useComparison`).

### 2. Bare throw of unknown error types — `evaluation.ts:72-78`, `completion.ts:92-99`

Both tRPC routers catch all errors but rethrow without wrapping non-`TRPCError` exceptions. Network errors, timeouts, etc. propagate without proper error formatting.

### 3. Unvalidated JSON parsing — `evaluation.ts:46-53`

`response.json()` is not in a try-catch. Then `parsed.score` and `parsed.reasoning` are extracted without validating they exist or have correct types — `Number("abc")` silently returns `NaN`.

### 4. Wrong tRPC error codes — `completion.ts:33-36`, `evaluation.ts:40-43`

Both throw `BAD_REQUEST` for all HTTP errors, including 5xx server errors. Should map status codes to appropriate tRPC codes.

## High

### 5. Duplicated API infrastructure — `completion.ts` + `evaluation.ts`

- OpenRouter URL `https://openrouter.ai/api/v1/chat/completions` hardcoded in both files
- Timeout `30_000` duplicated in both files
- Error handling pattern (check response, throw with status) duplicated

### 6. Duplicated evaluation logic — `comparison-workbench.tsx:100-133` vs `224-254`

`runEvaluations()` and `retryEvaluation()` have nearly identical mutation calls, `.then()/.catch()` chains, and state update patterns.

### 7. Duplicated model picker code — `model-picker.tsx`

`SingleModelPicker` and `MultiModelPicker` duplicate custom ID input handling, model selection rendering, and state management. Should share code via composition.

### 8. Excessive prop drilling — `user-input.tsx` (10 props), `config-panel.tsx` (8 props), `response-pair.tsx` (9 props)

Config-related props (`model`, `onModelChange`, `evaluatorModels`, `onEvaluatorModelsChange`, `shuffle`, `onShuffleChange`, `webSearch`, `onWebSearchChange`) drilled through multiple layers. Consider a config context.

### 9. Raw API errors exposed to client — `evaluation.ts:69`, `completion.ts:35`

Raw response text included in error messages. Could leak sensitive information or produce very long error strings.

## Medium

### 10. Dual source of truth — `comparison-workbench.tsx:58,70,161,194`

`contentRefs.current` used alongside React state for streaming content — an escape hatch that creates synchronization issues.

### 11. Fragile regex fallback — `evaluation.ts:56-64`

Regex fallback for malformed JSON is brittle. Partial matches can produce `score: NaN` with empty reasoning.

### 12. Inconsistent schema validation — `schemas.ts:5,11`

`systemPrompt` allows empty strings, `userMessage` requires `.min(1)`. Inconsistent without documented rationale.

### 13. Dead code — `init.ts:22`

`publicProcedure` is exported but never used anywhere. Both routers use `authedProcedure` exclusively.

### 14. Hardcoded magic numbers scattered throughout

- `codemirror-editor.tsx:33` — `2000` timeout
- `response-panel.tsx` — `16` (y offset), `1.5` (gap), `32` (max-h)
- `evaluation-results.tsx:15-21` — Score thresholds `8`, `5`
- `mode-toggle.tsx:20-21` — `h-[1.2rem] w-[1.2rem]`

## Low

### 15. Accessibility gaps

- `header.tsx:25` — KeyIcon missing aria label
- `star-button.tsx:37` — StarIcon missing aria label
- `accordion.tsx:44-45` — Chevron icons missing `aria-hidden`
- `dialog.tsx:73` — XIcon missing `aria-hidden`

### 16. Unused variable — `user-input.tsx:37`

`textareaRef` declared but never used.

### 17. State sync issue — `api-key-dialog.tsx:24-25`

`value` and `persist` state duplicates props without `useEffect` to sync when props change.

## Recommended Fix Priority

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Fix error handling in tRPC routers (items 2-4) | Prevents crashes, proper error codes |
| 2 | Extract hooks from ComparisonWorkbench (item 1) | Maintainability, testability |
| 3 | Deduplicate API infra into shared utility (item 5) | DRY, single point of change |
| 4 | Add config context to reduce prop drilling (item 8) | Cleaner component tree |
| 5 | Validate evaluation response with Zod schema (item 3) | Type safety, no silent NaN |
| 6 | Extract constants for magic numbers (item 14) | Readability |
| 7 | Fix accessibility issues (item 15) | A11y compliance |
