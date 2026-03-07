'use client';

import { PlusIcon, RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { DEFAULT_CONFIG, MAX_PROMPTS, MIN_PROMPTS } from '@/lib/constants';
import type { ComparisonConfig, ComparisonPhase, ResponseState } from '@/lib/types';
import { api } from '@/trpc/client';
import { ApiKeyDialog } from './api-key-dialog';
import { Footer } from './footer';
import { Header } from './header';
import { PromptEditor } from './prompt-editor';
import { ResponsePair } from './response-pair';
import { UserInput } from './user-input';

const PROMPT_LABELS = ['A', 'B', 'C', 'D'];
const IS_DEV = process.env.NODE_ENV === 'development';

interface State {
    phase: ComparisonPhase;
    prompts: string[];
    userMessage: string;
    config: ComparisonConfig;
    responses: ResponseState[];
    displayOrder: number[];
    preference: number | null;
}

const emptyResponse: ResponseState = {
    content: '',
    done: false,
    error: null,
    evaluations: [],
    startedAt: null,
    completedAt: null
};

function makeInitialResponses(count: number): ResponseState[] {
    return Array.from({ length: count }, () => ({ ...emptyResponse }));
}

export function ComparisonWorkbench() {
    const { apiKey, setApiKey, persistent } = useApiKey();
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

    const [state, setState] = useState<State>({
        phase: 'editing',
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
        if (state.phase === 'streaming') {
            responseSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [state.phase]);

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && (state.phase === 'responded' || state.phase === 'revealed')) {
                contentRefs.current = Array(state.prompts.length).fill('');
                setState((prev) => ({
                    ...prev,
                    phase: 'editing',
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
                    api()
                        .evaluation.evaluate.mutate({
                            model: evaluatorModel,
                            systemPrompt: prompts[promptIndex],
                            userMessage,
                            response: content
                        })
                        .then((result) => {
                            setState((prev) => {
                                const responses = [...prev.responses];
                                responses[responseIndex] = {
                                    ...responses[responseIndex],
                                    evaluations: [
                                        ...responses[responseIndex].evaluations,
                                        { evaluatorModel, ...result }
                                    ]
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
        setState((prev) => {
            const responses = [...prev.responses];
            responses[index] = { ...responses[index], startedAt: Date.now() };
            return { ...prev, responses };
        });

        try {
            const iterable = await api().completion.generate.query({
                model,
                systemPrompt,
                userMessage
            });

            for await (const chunk of iterable) {
                if (chunk.type === 'delta') {
                    contentRefs.current[index] += chunk.content;
                    setState((prev) => {
                        const responses = [...prev.responses];
                        responses[index] = {
                            ...responses[index],
                            content: responses[index].content + chunk.content
                        };
                        return { ...prev, responses };
                    });
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to get response';
            setState((prev) => {
                const responses = [...prev.responses];
                responses[index] = { ...responses[index], error: message, done: true, completedAt: Date.now() };
                return { ...prev, responses };
            });
            return null;
        }

        setState((prev) => {
            const responses = [...prev.responses];
            responses[index] = { ...responses[index], done: true, completedAt: Date.now() };
            return { ...prev, responses };
        });
        return contentRefs.current[index];
    }

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

    async function handleSend() {
        if (!apiKey) {
            setApiKeyDialogOpen(true);
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
            phase: 'streaming',
            responses: makeInitialResponses(count),
            displayOrder,
            preference: null
        }));

        const model = state.config.webSearch ? `${state.config.model}:online` : state.config.model;
        const evalModels = state.config.webSearch
            ? state.config.evaluatorModels.map((m) => `${m}:online`)
            : state.config.evaluatorModels;

        const contents = await Promise.all(
            displayOrder.map((promptIndex, i) =>
                streamResponse(i, model, state.prompts[promptIndex], state.userMessage)
            )
        );

        setState((prev) => ({ ...prev, phase: 'responded' }));

        runEvaluations(state.prompts, state.userMessage, contents, displayOrder, evalModels);
    }

    function handleReset() {
        contentRefs.current = Array(state.prompts.length).fill('');

        setState((prev) => ({
            ...prev,
            phase: 'editing',
            responses: makeInitialResponses(prev.prompts.length),
            preference: null
        }));
    }

    function handleAddPrompt() {
        setState((prev) => ({
            ...prev,
            prompts: [...prev.prompts, ''],
            responses: makeInitialResponses(prev.prompts.length + 1)
        }));
    }

    function handleRemovePrompt(index: number) {
        setState((prev) => {
            const prompts = prev.prompts.filter((_, i) => i !== index);
            return {
                ...prev,
                prompts,
                responses: makeInitialResponses(prompts.length)
            };
        });
    }

    const isActive = state.phase !== 'editing';
    const promptCount = state.prompts.length;
    const gridCols = promptCount === 2 ? 'md:grid-cols-2' : promptCount === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

    return (
        <div className='flex h-screen flex-col'>
            <Header hasApiKey={!!apiKey} onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

            <div className='flex flex-1 flex-col gap-4 overflow-auto p-4'>
                {/* Prompt editors */}
                <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
                    {state.prompts.map((prompt, i) => (
                        <PromptEditor
                            key={i}
                            label={`Prompt ${PROMPT_LABELS[i]}`}
                            value={prompt}
                            onChange={(v) =>
                                setState((prev) => {
                                    const prompts = [...prev.prompts];
                                    prompts[i] = v;
                                    return { ...prev, prompts };
                                })
                            }
                            disabled={isActive}
                            onRemove={promptCount > MIN_PROMPTS && !isActive ? () => handleRemovePrompt(i) : undefined}
                        />
                    ))}
                </div>
                {promptCount < MAX_PROMPTS && !isActive && (
                    <Button variant='outline' size='sm' className='self-start gap-1.5' onClick={handleAddPrompt}>
                        <PlusIcon className='size-3.5' />
                        Add Prompt
                    </Button>
                )}

                {/* User input + config */}
                <UserInput
                    value={state.userMessage}
                    onChange={(v) => setState((prev) => ({ ...prev, userMessage: v }))}
                    onSend={handleSend}
                    model={state.config.model}
                    onModelChange={(model) => setState((prev) => ({ ...prev, config: { ...prev.config, model } }))}
                    evaluatorModels={state.config.evaluatorModels}
                    onEvaluatorModelsChange={(evaluatorModels) =>
                        setState((prev) => ({ ...prev, config: { ...prev.config, evaluatorModels } }))
                    }
                    shuffle={state.config.shuffle}
                    onShuffleChange={(shuffle) =>
                        setState((prev) => ({ ...prev, config: { ...prev.config, shuffle } }))
                    }
                    webSearch={state.config.webSearch}
                    onWebSearchChange={(webSearch) =>
                        setState((prev) => ({ ...prev, config: { ...prev.config, webSearch } }))
                    }
                    disabled={isActive}
                />

                {/* Responses */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            ref={responseSectionRef}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className='space-y-4'
                        >
                            <ResponsePair
                                responses={state.responses}
                                expectedEvalCount={state.config.evaluatorModels.length}
                                phase={state.phase}
                                preference={state.preference}
                                onPrefer={(index) =>
                                    setState((prev) => ({ ...prev, phase: 'revealed', preference: index }))
                                }
                                onRetryResponse={retryResponse}
                                onRetryEvaluation={retryEvaluation}
                                revealedPrompts={
                                    state.phase === 'revealed'
                                        ? state.displayOrder.map((pi) => ({
                                              label: `Prompt ${PROMPT_LABELS[pi]}`,
                                              text: state.prompts[pi]
                                          }))
                                        : null
                                }
                                gridCols={gridCols}
                            />

                            {(state.phase === 'responded' || state.phase === 'revealed') && (
                                <div className='flex justify-center'>
                                    <Button variant='outline' size='sm' className='gap-1.5' onClick={handleReset}>
                                        <RotateCcwIcon className='size-3.5' />
                                        New Comparison
                                        <kbd className='pointer-events-none ml-1 hidden rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground sm:inline'>
                                            Esc
                                        </kbd>
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <Footer />

            <ApiKeyDialog
                open={apiKeyDialogOpen}
                onOpenChange={setApiKeyDialogOpen}
                apiKey={apiKey}
                persistent={persistent}
                onSave={setApiKey}
            />
        </div>
    );
}
