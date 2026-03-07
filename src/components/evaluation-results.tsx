'use client';

import { ChevronDownIcon, RotateCcwIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
                                <Button
                                    variant='ghost'
                                    className='flex h-auto w-full items-center justify-between rounded-none px-2.5 py-1.5 text-left'
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
                                                <Button
                                                    variant='ghost'
                                                    size='icon-xs'
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRetryEvaluation(evaluation.evaluatorModel);
                                                    }}
                                                    aria-label={`Retry ${display.name} evaluation`}
                                                >
                                                    <RotateCcwIcon className='size-3' />
                                                </Button>
                                            </span>
                                        )}
                                    </span>
                                </Button>
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
