'use client';

import { cjk } from '@streamdown/cjk';
import { code } from '@streamdown/code';
import { math } from '@streamdown/math';
import { mermaid } from '@streamdown/mermaid';
import { AlertCircleIcon, CheckCircleIcon, RotateCcwIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { Streamdown } from 'streamdown';
import 'katex/dist/katex.min.css';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ComparisonPhase, EvaluationResult } from '@/lib/types';
import { EvaluationResults } from './evaluation-results';

interface ResponsePanelProps {
    index: number;
    content: string;
    done: boolean;
    error: string | null;
    evaluations: EvaluationResult[];
    expectedEvalCount: number;
    phase: ComparisonPhase;
    isPreferred: boolean;
    showPreferButton: boolean;
    onPrefer: () => void;
    onRetryResponse: () => void;
    onRetryEvaluation: (evaluatorModel: string) => void;
    revealedPrompt: string | null;
    revealedLabel: string | null;
}

export function ResponsePanel({
    index,
    content,
    done,
    error,
    evaluations,
    expectedEvalCount,
    phase,
    isPreferred,
    showPreferButton,
    onPrefer,
    onRetryResponse,
    onRetryEvaluation,
    revealedPrompt,
    revealedLabel
}: ResponsePanelProps) {
    const isStreaming = phase === 'streaming' && !done;
    const evaluating = done && !error && evaluations.length < expectedEvalCount && expectedEvalCount > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col rounded-xl border ${isPreferred ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : ''}`}
        >
            <div className='flex items-center justify-between border-b px-4 py-2'>
                <span className='text-xs font-medium text-muted-foreground'>Response {index + 1}</span>
                {isStreaming && (
                    <span className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <span className='size-1.5 animate-pulse rounded-full bg-blue-500' />
                        Streaming...
                    </span>
                )}
                {done && !isStreaming && !error && phase !== 'editing' && (
                    <span className='text-xs text-muted-foreground'>Complete</span>
                )}
                {error && <span className='text-xs text-red-500'>Error</span>}
            </div>

            <ScrollArea className='min-h-[200px] max-h-[400px]'>
                <div className='p-4 text-sm leading-relaxed'>
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
                        <Streamdown
                            className='prose prose-sm dark:prose-invert max-w-none'
                            plugins={{ code, mermaid, math, cjk }}
                            controls={{
                                code: true,
                                table: true,
                                mermaid: { download: true, copy: true, fullscreen: true, panZoom: true }
                            }}
                        >
                            {content}
                        </Streamdown>
                    ) : (
                        <span className='text-muted-foreground italic'>Waiting for response...</span>
                    )}
                    {isStreaming && <span className='inline-block h-4 w-0.5 animate-pulse bg-foreground' />}
                </div>
            </ScrollArea>

            {!error && (showPreferButton || phase === 'revealed' || evaluating || evaluations.length > 0) && (
                <div className='space-y-3 border-t p-4'>
                    {showPreferButton && done && (
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
                            onRetryEvaluation={onRetryEvaluation}
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
