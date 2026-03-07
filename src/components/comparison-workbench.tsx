'use client';

import { PlusIcon, RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { DEFAULT_CONFIG, MAX_PROMPTS, MIN_PROMPTS } from '@/lib/constants';
import type { ComparisonConfig, ComparisonPhase, ResponseState } from '@/lib/types';
import { api } from '@/trpc/client';
import { ApiKeyDialog } from './api-key-dialog';
import { Header } from './header';
import { PromptEditor } from './prompt-editor';
import { ResponsePair } from './response-pair';
import { UserInput } from './user-input';

const PROMPT_LABELS = ['A', 'B', 'C', 'D'];

interface State {
    phase: ComparisonPhase;
    prompts: string[];
    userMessage: string;
    config: ComparisonConfig;
    responses: ResponseState[];
    displayOrder: number[];
    preference: number | null;
}

const emptyResponse: ResponseState = { content: '', done: false, evaluations: [] };

function makeInitialResponses(count: number): ResponseState[] {
    return Array.from({ length: count }, () => ({ ...emptyResponse }));
}

export function ComparisonWorkbench() {
    const { apiKey, setApiKey, persistent } = useApiKey();
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

    const [state, setState] = useState<State>({
        phase: 'editing',
        prompts: ['', ''],
        userMessage: '',
        config: DEFAULT_CONFIG,
        responses: makeInitialResponses(2),
        displayOrder: [0, 1],
        preference: null
    });

    const contentRefs = useRef<string[]>(['', '']);

    const runEvaluations = useCallback(
        (prompts: string[], userMessage: string, contents: string[], displayOrder: number[], evaluatorModels: string[]) => {
            if (evaluatorModels.length === 0) return;

            for (let i = 0; i < displayOrder.length; i++) {
                const promptIndex = displayOrder[i];
                for (const evaluatorModel of evaluatorModels) {
                    api()
                        .evaluation.evaluate.mutate({
                            model: evaluatorModel,
                            systemPrompt: prompts[promptIndex],
                            userMessage,
                            response: contents[i]
                        })
                        .then((result) => {
                            setState((prev) => {
                                const responses = [...prev.responses];
                                responses[i] = {
                                    ...responses[i],
                                    evaluations: [...responses[i].evaluations, { evaluatorModel, ...result }]
                                };
                                return { ...prev, responses };
                            });
                        })
                        .catch(() => {
                            setState((prev) => {
                                const responses = [...prev.responses];
                                responses[i] = {
                                    ...responses[i],
                                    evaluations: [
                                        ...responses[i].evaluations,
                                        { evaluatorModel, score: -1, reasoning: 'Evaluation failed' }
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
    ): Promise<string> {
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
        } catch {
            if (!contentRefs.current[index]) {
                contentRefs.current[index] = 'Error: Failed to get response';
                setState((prev) => {
                    const responses = [...prev.responses];
                    responses[index] = { ...responses[index], content: 'Error: Failed to get response' };
                    return { ...prev, responses };
                });
            }
        }

        setState((prev) => {
            const responses = [...prev.responses];
            responses[index] = { ...responses[index], done: true };
            return { ...prev, responses };
        });
        return contentRefs.current[index];
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
    const gridCols =
        promptCount === 2 ? 'md:grid-cols-2' : promptCount === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-4'>
                            <ResponsePair
                                responses={state.responses}
                                expectedEvalCount={state.config.evaluatorModels.length}
                                phase={state.phase}
                                preference={state.preference}
                                onPrefer={(index) =>
                                    setState((prev) => ({ ...prev, phase: 'revealed', preference: index }))
                                }
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
                                        Try Again
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
