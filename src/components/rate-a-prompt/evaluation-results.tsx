import { RotateCcwIcon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
            <Accordion>
                {evaluations.map((evaluation) => {
                    const display = getModelDisplay(evaluation.evaluatorModel);
                    return (
                        <AccordionItem
                            key={evaluation.evaluatorModel}
                            value={evaluation.evaluatorModel}
                            className='rounded-md border'
                        >
                            <AccordionTrigger className='px-2.5 py-1.5 text-xs hover:no-underline **:data-[slot=accordion-trigger-icon]:size-3'>
                                <span className='flex flex-1 items-center justify-between'>
                                    <span className='truncate'>{display.name}</span>
                                    <span className={`text-xs font-semibold mr-2 ${scoreColor(evaluation.score)}`}>
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
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className='border-t px-2.5 py-2 text-xs leading-relaxed text-muted-foreground'>
                                {evaluation.reasoning}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
                {loading &&
                    Array.from({ length: expectedCount - evaluations.length }, (_, i) => `skeleton-${i}`).map((key) => (
                        <Skeleton key={key} className='h-8 w-full rounded-md' />
                    ))}
            </Accordion>
        </div>
    );
}
