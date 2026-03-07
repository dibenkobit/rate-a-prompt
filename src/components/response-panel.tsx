'use client';

import { CheckCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ComparisonPhase, EvaluationResult } from '@/lib/types';
import { EvaluationResults } from './evaluation-results';

interface ResponsePanelProps {
    side: 'left' | 'right';
    content: string;
    done: boolean;
    evaluations: EvaluationResult[];
    expectedEvalCount: number;
    phase: ComparisonPhase;
    preference: 'left' | 'right' | null;
    onPrefer: () => void;
    revealedPrompt: string | null;
    revealedLabel: string | null;
}

export function ResponsePanel({
    side,
    content,
    done,
    evaluations,
    expectedEvalCount,
    phase,
    preference,
    onPrefer,
    revealedPrompt,
    revealedLabel
}: ResponsePanelProps) {
    const isPreferred = preference === side;
    const showPreferButton = phase === 'responded' && preference === null;
    const isStreaming = phase === 'streaming' && !done;
    const evaluating = done && evaluations.length < expectedEvalCount && expectedEvalCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col rounded-xl border ${isPreferred ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : ''}`}
        >
            <div className='flex items-center justify-between border-b px-4 py-2'>
                <span className='text-xs font-medium text-muted-foreground'>
                    Response {side === 'left' ? 'Left' : 'Right'}
                </span>
                {isStreaming && (
                    <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <span className='size-1.5 animate-pulse rounded-full bg-blue-500' />
                        Streaming...
                    </span>
                )}
                {done && !isStreaming && phase !== 'editing' && (
                    <span className='text-xs text-muted-foreground'>Complete</span>
                )}
            </div>

            <ScrollArea className='min-h-[200px] max-h-[400px]'>
                <div className='whitespace-pre-wrap p-4 text-sm leading-relaxed'>
                    {content || <span className='text-muted-foreground italic'>Waiting for response...</span>}
                    {isStreaming && <span className='inline-block h-4 w-0.5 animate-pulse bg-foreground' />}
                </div>
            </ScrollArea>

            {(showPreferButton || phase === 'revealed' || evaluating || evaluations.length > 0) && (
                <div className='space-y-3 border-t p-4'>
                    {showPreferButton && (
                        <Button variant='outline' size='sm' className='w-full gap-1.5' onClick={onPrefer}>
                            <CheckCircleIcon className='size-3.5' />I prefer this one
                        </Button>
                    )}

                    {isPreferred && (
                        <div className='flex items-center gap-1.5 text-xs text-emerald-500'>
                            <CheckCircleIcon className='size-3.5' />
                            Your preference
                        </div>
                    )}

                    {(evaluations.length > 0 || evaluating) && (
                        <EvaluationResults
                            evaluations={evaluations}
                            expectedCount={expectedEvalCount}
                            loading={evaluating}
                        />
                    )}

                    {phase === 'revealed' && revealedLabel && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className='space-y-1.5'
                        >
                            <span className='text-xs font-semibold text-muted-foreground'>{revealedLabel}</span>
                            <pre className='max-h-32 overflow-auto rounded-md bg-muted p-2.5 font-mono text-xs leading-relaxed'>
                                {revealedPrompt}
                            </pre>
                        </motion.div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
