'use client';

import { RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { DEFAULT_CONFIG } from '@/lib/constants';
import type { ComparisonConfig, ComparisonPhase, ResponseState } from '@/lib/types';
import { api } from '@/trpc/client';
import { ApiKeyDialog } from './api-key-dialog';
import { Header } from './header';
import { PromptEditor } from './prompt-editor';
import { ResponsePair } from './response-pair';
import { UserInput } from './user-input';

interface State {
    phase: ComparisonPhase;
    promptA: string;
    promptB: string;
    userMessage: string;
    config: ComparisonConfig;
    left: ResponseState;
    right: ResponseState;
    leftIsA: boolean;
    preference: 'left' | 'right' | null;
}

const emptyResponse: ResponseState = { content: '', done: false, evaluations: [] };

export function ComparisonWorkbench() {
    const { apiKey, setApiKey } = useApiKey();
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

    const [state, setState] = useState<State>({
        phase: 'editing',
        promptA: '',
        promptB: '',
        userMessage: '',
        config: DEFAULT_CONFIG,
        left: { ...emptyResponse },
        right: { ...emptyResponse },
        leftIsA: true,
        preference: null
    });

    const leftContentRef = useRef('');
    const rightContentRef = useRef('');

    const runEvaluations = useCallback(
        (
            leftPrompt: string,
            rightPrompt: string,
            userMessage: string,
            leftContent: string,
            rightContent: string,
            evaluatorModels: string[]
        ) => {
            if (evaluatorModels.length === 0) return;

            for (const evaluatorModel of evaluatorModels) {
                api()
                    .evaluation.evaluate.mutate({
                        model: evaluatorModel,
                        systemPrompt: leftPrompt,
                        userMessage,
                        response: leftContent
                    })
                    .then((result) => {
                        setState((prev) => ({
                            ...prev,
                            left: {
                                ...prev.left,
                                evaluations: [...prev.left.evaluations, { evaluatorModel, ...result }]
                            }
                        }));
                    })
                    .catch(() => {
                        setState((prev) => ({
                            ...prev,
                            left: {
                                ...prev.left,
                                evaluations: [
                                    ...prev.left.evaluations,
                                    { evaluatorModel, score: -1, reasoning: 'Evaluation failed' }
                                ]
                            }
                        }));
                    });

                api()
                    .evaluation.evaluate.mutate({
                        model: evaluatorModel,
                        systemPrompt: rightPrompt,
                        userMessage,
                        response: rightContent
                    })
                    .then((result) => {
                        setState((prev) => ({
                            ...prev,
                            right: {
                                ...prev.right,
                                evaluations: [...prev.right.evaluations, { evaluatorModel, ...result }]
                            }
                        }));
                    })
                    .catch(() => {
                        setState((prev) => ({
                            ...prev,
                            right: {
                                ...prev.right,
                                evaluations: [
                                    ...prev.right.evaluations,
                                    { evaluatorModel, score: -1, reasoning: 'Evaluation failed' }
                                ]
                            }
                        }));
                    });
            }
        },
        []
    );

    async function streamSide(
        side: 'left' | 'right',
        model: string,
        systemPrompt: string,
        userMessage: string
    ): Promise<string> {
        const contentRef = side === 'left' ? leftContentRef : rightContentRef;
        try {
            const iterable = await api().completion.generate.query({
                model,
                systemPrompt,
                userMessage
            });

            for await (const chunk of iterable) {
                if (chunk.type === 'delta') {
                    contentRef.current += chunk.content;
                    setState((prev) => ({
                        ...prev,
                        [side]: { ...prev[side], content: prev[side].content + chunk.content }
                    }));
                }
            }
        } catch {
            if (!contentRef.current) {
                contentRef.current = 'Error: Failed to get response';
                setState((prev) => ({
                    ...prev,
                    [side]: { ...prev[side], content: 'Error: Failed to get response' }
                }));
            }
        }

        setState((prev) => ({
            ...prev,
            [side]: { ...prev[side], done: true }
        }));
        return contentRef.current;
    }

    async function handleSend() {
        if (!apiKey) {
            setApiKeyDialogOpen(true);
            return;
        }
        if (!state.promptA.trim() || !state.promptB.trim() || !state.userMessage.trim()) return;

        const leftIsA = state.config.shuffle ? Math.random() > 0.5 : true;
        const leftPrompt = leftIsA ? state.promptA : state.promptB;
        const rightPrompt = leftIsA ? state.promptB : state.promptA;

        leftContentRef.current = '';
        rightContentRef.current = '';

        setState((prev) => ({
            ...prev,
            phase: 'streaming',
            left: { ...emptyResponse },
            right: { ...emptyResponse },
            leftIsA,
            preference: null
        }));

        const [leftContent, rightContent] = await Promise.all([
            streamSide('left', state.config.model, leftPrompt, state.userMessage),
            streamSide('right', state.config.model, rightPrompt, state.userMessage)
        ]);

        setState((prev) => ({ ...prev, phase: 'responded' }));

        runEvaluations(
            leftPrompt,
            rightPrompt,
            state.userMessage,
            leftContent,
            rightContent,
            state.config.evaluatorModels
        );
    }

    function handleReset() {
        leftContentRef.current = '';
        rightContentRef.current = '';

        setState((prev) => ({
            ...prev,
            phase: 'editing',
            left: { ...emptyResponse },
            right: { ...emptyResponse },
            preference: null
        }));
    }

    const isActive = state.phase !== 'editing';
    const leftRevealedPrompt = state.phase === 'revealed' ? (state.leftIsA ? state.promptA : state.promptB) : null;
    const rightRevealedPrompt = state.phase === 'revealed' ? (state.leftIsA ? state.promptB : state.promptA) : null;
    const leftRevealedLabel = state.phase === 'revealed' ? (state.leftIsA ? 'Prompt A' : 'Prompt B') : null;
    const rightRevealedLabel = state.phase === 'revealed' ? (state.leftIsA ? 'Prompt B' : 'Prompt A') : null;

    return (
        <div className='flex h-screen flex-col'>
            <Header hasApiKey={!!apiKey} onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

            <div className='flex flex-1 flex-col gap-4 overflow-auto p-4'>
                {/* Prompt editors */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <PromptEditor
                        label='Prompt A'
                        value={state.promptA}
                        onChange={(v) => setState((prev) => ({ ...prev, promptA: v }))}
                        disabled={isActive}
                    />
                    <PromptEditor
                        label='Prompt B'
                        value={state.promptB}
                        onChange={(v) => setState((prev) => ({ ...prev, promptB: v }))}
                        disabled={isActive}
                    />
                </div>

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
                    disabled={isActive}
                />

                {/* Responses */}
                <AnimatePresence>
                    {isActive && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className='space-y-4'>
                            <ResponsePair
                                leftContent={state.left.content}
                                rightContent={state.right.content}
                                leftDone={state.left.done}
                                rightDone={state.right.done}
                                leftEvaluations={state.left.evaluations}
                                rightEvaluations={state.right.evaluations}
                                expectedEvalCount={state.config.evaluatorModels.length}
                                phase={state.phase}
                                preference={state.preference}
                                onPreferLeft={() =>
                                    setState((prev) => ({ ...prev, phase: 'revealed', preference: 'left' }))
                                }
                                onPreferRight={() =>
                                    setState((prev) => ({ ...prev, phase: 'revealed', preference: 'right' }))
                                }
                                leftRevealedPrompt={leftRevealedPrompt}
                                rightRevealedPrompt={rightRevealedPrompt}
                                leftRevealedLabel={leftRevealedLabel}
                                rightRevealedLabel={rightRevealedLabel}
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
                onSave={setApiKey}
            />
        </div>
    );
}
