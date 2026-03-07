'use client';

import { RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
                        return (
                            <motion.div
                                key={evaluation.evaluatorModel}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className='flex items-center justify-between rounded-md border px-2.5 py-1.5'
                            >
                                <span className='truncate text-xs'>{display.name}</span>
                                <Tooltip>
                                    <TooltipTrigger
                                        render={
                                            <span className={`text-xs font-semibold ${scoreColor(evaluation.score)}`} />
                                        }
                                    >
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
                                    </TooltipTrigger>
                                    <TooltipContent side='left' className='max-w-xs'>
                                        <p className='text-xs'>{evaluation.reasoning}</p>
                                    </TooltipContent>
                                </Tooltip>
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
