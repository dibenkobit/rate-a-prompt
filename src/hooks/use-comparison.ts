'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_CONFIG, MAX_PROMPTS } from '@/lib/constants';
import type { ComparisonConfig, ResponseState } from '@/lib/types';
import { ComparisonPhase } from '@/lib/types';
import { api } from '@/trpc/client';

const IS_DEV = process.env.NODE_ENV === 'development';

const emptyResponse: ResponseState = {
    content: '',
    done: false,
    error: null,
    evaluations: [],
    startedAt: null,
    completedAt: null,
    cost: null
};

function makeInitialResponses(count: number): ResponseState[] {
    return Array.from({ length: count }, () => ({ ...emptyResponse }));
}

interface State {
    phase: ComparisonPhase;
    prompts: string[];
    userMessage: string;
    config: ComparisonConfig;
    responses: ResponseState[];
    displayOrder: number[];
    preference: number | null;
}

function updateResponseAt(
    setState: React.Dispatch<React.SetStateAction<State>>,
    index: number,
    update: Partial<ResponseState> | ((prev: ResponseState) => Partial<ResponseState>)
) {
    setState((prev) => {
        const responses = [...prev.responses];
        const patch = typeof update === 'function' ? update(responses[index]) : update;
        responses[index] = { ...responses[index], ...patch };
        return { ...prev, responses };
    });
}

function appendEvaluation(
    setState: React.Dispatch<React.SetStateAction<State>>,
    responseIndex: number,
    evaluation: ResponseState['evaluations'][number]
) {
    setState((prev) => {
        const responses = [...prev.responses];
        responses[responseIndex] = {
            ...responses[responseIndex],
            evaluations: [...responses[responseIndex].evaluations, evaluation]
        };
        return { ...prev, responses };
    });
}

const COST_RETRY_DELAYS = [5000, 10000, 20000];

function fetchCostWithRetry(
    setState: React.Dispatch<React.SetStateAction<State>>,
    index: number,
    generationId: string,
    attempt = 0
) {
    setTimeout(() => {
        api()
            .generation.getCost.mutate({ generationId })
            .then((result) => {
                if (result.totalCost !== null) {
                    updateResponseAt(setState, index, { cost: result.totalCost });
                }
            })
            .catch(() => {
                if (attempt + 1 < COST_RETRY_DELAYS.length) {
                    fetchCostWithRetry(setState, index, generationId, attempt + 1);
                }
            });
    }, COST_RETRY_DELAYS[attempt]);
}

function fireEvaluation(
    setState: React.Dispatch<React.SetStateAction<State>>,
    responseIndex: number,
    evaluatorModel: string,
    params: { systemPrompt: string; userMessage: string; response: string }
) {
    api()
        .evaluation.evaluate.mutate({ model: evaluatorModel, ...params })
        .then((result) => {
            appendEvaluation(setState, responseIndex, { evaluatorModel, ...result });
        })
        .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : 'Evaluation failed';
            appendEvaluation(setState, responseIndex, { evaluatorModel, score: -1, reasoning: message });
        });
}

export function useComparison(apiKey: string | null, onMissingApiKey: () => void) {
    const [state, setState] = useState<State>({
        phase: ComparisonPhase.Editing,
        prompts: IS_DEV ? ['You are a pirate.', 'You are a robot.'] : ['', ''],
        userMessage: IS_DEV ? 'say hi in 3 words' : '',
        config: DEFAULT_CONFIG,
        responses: makeInitialResponses(2),
        displayOrder: [0, 1],
        preference: null
    });

    const contentRefs = useRef<string[]>(['', '']);
    const responseSectionRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (state.phase === ComparisonPhase.Streaming) {
            responseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [state.phase]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (
                e.key === 'Escape' &&
                (state.phase === ComparisonPhase.Responded || state.phase === ComparisonPhase.Revealed)
            ) {
                contentRefs.current = Array(state.prompts.length).fill('');
                setState((prev) => ({
                    ...prev,
                    phase: ComparisonPhase.Editing,
                    responses: makeInitialResponses(prev.prompts.length),
                    preference: null
                }));
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.phase, state.prompts.length]);

    const runEvaluations = useCallback(
        (
            prompts: string[],
            userMessage: string,
            contents: (string | null)[],
            displayOrder: number[],
            evaluatorModels: string[],
            startIndex = 0
        ) => {
            if (evaluatorModels.length === 0) return;

            for (let i = 0; i < displayOrder.length; i++) {
                const content = contents[i];
                if (!content) continue;
                const promptIndex = displayOrder[i];
                const responseIndex = startIndex + i;
                for (const evaluatorModel of evaluatorModels) {
                    fireEvaluation(setState, responseIndex, evaluatorModel, {
                        systemPrompt: prompts[promptIndex],
                        userMessage,
                        response: content
                    });
                }
            }
        },
        []
    );

    async function streamResponse(
        index: number,
        model: string,
        systemPrompt: string,
        userMessage: string
    ): Promise<string | null> {
        updateResponseAt(setState, index, { startedAt: Date.now() });
        let generationId: string | null = null;

        try {
            const iterable = await api().completion.generate.query({
                model,
                systemPrompt,
                userMessage
            });

            for await (const chunk of iterable) {
                if (chunk.type === 'delta') {
                    contentRefs.current[index] += chunk.content;
                    updateResponseAt(setState, index, (prev) => ({
                        content: prev.content + chunk.content
                    }));
                } else if (chunk.type === 'generationId') {
                    generationId = chunk.generationId;
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get response';
            updateResponseAt(setState, index, { error: message, done: true, completedAt: Date.now() });
            return null;
        }

        updateResponseAt(setState, index, { done: true, completedAt: Date.now() });

        if (generationId) {
            fetchCostWithRetry(setState, index, generationId);
        }

        return contentRefs.current[index];
    }

    function getEffectiveModels() {
        const model = state.config.webSearch ? `${state.config.model}:online` : state.config.model;
        const evalModels = state.config.webSearch
            ? state.config.evaluatorModels.map((m) => `${m}:online`)
            : state.config.evaluatorModels;
        return { model, evalModels };
    }

    async function send() {
        if (!apiKey) {
            onMissingApiKey();
            return;
        }
        if (state.prompts.some((p) => !p.trim()) || !state.userMessage.trim()) return;

        const count = state.prompts.length;
        const displayOrder = state.config.shuffle
            ? [...Array(count).keys()].sort(() => Math.random() - 0.5)
            : [...Array(count).keys()];

        contentRefs.current = Array(count).fill('');

        setState((prev) => ({
            ...prev,
            phase: ComparisonPhase.Streaming,
            responses: makeInitialResponses(count),
            displayOrder,
            preference: null
        }));

        const { model, evalModels } = getEffectiveModels();

        const contents = await Promise.all(
            displayOrder.map((promptIndex, i) =>
                streamResponse(i, model, state.prompts[promptIndex], state.userMessage)
            )
        );

        setState((prev) => ({ ...prev, phase: ComparisonPhase.Responded }));

        runEvaluations(state.prompts, state.userMessage, contents, displayOrder, evalModels);
    }

    function reset() {
        contentRefs.current = Array(state.prompts.length).fill('');
        setState((prev) => ({
            ...prev,
            phase: ComparisonPhase.Editing,
            responses: makeInitialResponses(prev.prompts.length),
            preference: null
        }));
    }

    async function retryResponse(index: number) {
        const promptIndex = state.displayOrder[index];
        const { model, evalModels } = getEffectiveModels();

        contentRefs.current[index] = '';
        updateResponseAt(setState, index, { ...emptyResponse });

        const content = await streamResponse(index, model, state.prompts[promptIndex], state.userMessage);
        if (content) {
            runEvaluations(state.prompts, state.userMessage, [content], [state.displayOrder[index]], evalModels, index);
        }
    }

    function retryEvaluation(responseIndex: number, evaluatorModel: string) {
        const content = contentRefs.current[responseIndex];
        if (!content) return;
        const promptIndex = state.displayOrder[responseIndex];

        setState((prev) => {
            const responses = [...prev.responses];
            responses[responseIndex] = {
                ...responses[responseIndex],
                evaluations: responses[responseIndex].evaluations.filter((e) => e.evaluatorModel !== evaluatorModel)
            };
            return { ...prev, responses };
        });

        fireEvaluation(setState, responseIndex, evaluatorModel, {
            systemPrompt: state.prompts[promptIndex],
            userMessage: state.userMessage,
            response: content
        });
    }

    function addPrompt() {
        setState((prev) => ({
            ...prev,
            prompts: [...prev.prompts, ''],
            responses: makeInitialResponses(prev.prompts.length + 1)
        }));
    }

    function removePrompt(index: number) {
        setState((prev) => {
            const prompts = prev.prompts.filter((_, i) => i !== index);
            return { ...prev, prompts, responses: makeInitialResponses(prompts.length) };
        });
    }

    function updatePrompt(index: number, value: string) {
        setState((prev) => {
            const prompts = [...prev.prompts];
            prompts[index] = value;
            return { ...prev, prompts };
        });
    }

    function updateMessage(value: string) {
        setState((prev) => ({ ...prev, userMessage: value }));
    }

    function updateConfig(patch: Partial<ComparisonConfig>) {
        setState((prev) => ({ ...prev, config: { ...prev.config, ...patch } }));
    }

    function prefer(index: number) {
        setState((prev) => ({ ...prev, phase: ComparisonPhase.Revealed, preference: index }));
    }

    const isActive = state.phase !== ComparisonPhase.Editing;
    const canAddPrompt = state.prompts.length < MAX_PROMPTS && !isActive;
    const gridCols =
        state.prompts.length === 2
            ? 'md:grid-cols-2'
            : state.prompts.length === 3
              ? 'md:grid-cols-3'
              : 'md:grid-cols-4';

    return {
        state,
        responseSectionRef,
        isActive,
        canAddPrompt,
        gridCols,
        actions: {
            send,
            reset,
            retryResponse,
            retryEvaluation,
            addPrompt,
            removePrompt,
            updatePrompt,
            updateMessage,
            updateConfig,
            prefer
        }
    };
}
