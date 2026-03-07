'use client';

import { PlusIcon, RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/hooks/use-api-key';
import { useComparison } from '@/hooks/use-comparison';
import { MIN_PROMPTS } from '@/lib/constants';
import { Footer } from '../layout/footer';
import { Header } from '../layout/header';
import { ApiKeyDialog } from './api-key-dialog';
import { PromptEditor } from './prompt-editor';
import { ResponsePair } from './response-pair';
import { UserInput } from './user-input';

const PROMPT_LABELS = ['A', 'B', 'C', 'D'];

export function ComparisonWorkbench() {
    const { apiKey, setApiKey, persistent } = useApiKey();
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

    const { state, responseSectionRef, isActive, canAddPrompt, gridCols, actions } = useComparison(apiKey, () =>
        setApiKeyDialogOpen(true)
    );

    const promptCount = state.prompts.length;

    return (
        <div className='flex h-screen flex-col'>
            <Header hasApiKey={!!apiKey} onOpenApiKeyDialog={() => setApiKeyDialogOpen(true)} />

            <div className='flex flex-1 flex-col gap-4 overflow-auto mt-8 min-h-screen container mx-auto'>
                {/* Prompt editors */}
                <div className='flex gap-4'>
                    <div className={`grid flex-1 grid-cols-1 gap-4 ${gridCols}`}>
                        {state.prompts.map((prompt, i) => (
                            <PromptEditor
                                key={i}
                                label={`Prompt ${PROMPT_LABELS[i]}`}
                                value={prompt}
                                onChange={(v) => actions.updatePrompt(i, v)}
                                disabled={isActive}
                                onRemove={
                                    promptCount > MIN_PROMPTS && !isActive ? () => actions.removePrompt(i) : undefined
                                }
                            />
                        ))}
                    </div>
                    {canAddPrompt && (
                        <Button variant='outline' size='icon' className='h-auto' onClick={actions.addPrompt}>
                            <PlusIcon className='size-4' />
                        </Button>
                    )}
                </div>

                {/* User input + config */}
                <UserInput
                    value={state.userMessage}
                    onChange={actions.updateMessage}
                    onSend={actions.send}
                    model={state.config.model}
                    onModelChange={(model) => actions.updateConfig({ model })}
                    evaluatorModels={state.config.evaluatorModels}
                    onEvaluatorModelsChange={(evaluatorModels) => actions.updateConfig({ evaluatorModels })}
                    shuffle={state.config.shuffle}
                    onShuffleChange={(shuffle) => actions.updateConfig({ shuffle })}
                    webSearch={state.config.webSearch}
                    onWebSearchChange={(webSearch) => actions.updateConfig({ webSearch })}
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
                                onPrefer={actions.prefer}
                                onRetryResponse={actions.retryResponse}
                                onRetryEvaluation={actions.retryEvaluation}
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
                                    <Button variant='outline' onClick={actions.reset}>
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
