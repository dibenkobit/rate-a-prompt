'use client';

import type { ComparisonPhase, EvaluationResult } from '@/lib/types';
import { ResponsePanel } from './response-panel';

interface ResponsePairProps {
    leftContent: string;
    rightContent: string;
    leftDone: boolean;
    rightDone: boolean;
    leftEvaluations: EvaluationResult[];
    rightEvaluations: EvaluationResult[];
    expectedEvalCount: number;
    phase: ComparisonPhase;
    preference: 'left' | 'right' | null;
    onPreferLeft: () => void;
    onPreferRight: () => void;
    leftRevealedPrompt: string | null;
    rightRevealedPrompt: string | null;
    leftRevealedLabel: string | null;
    rightRevealedLabel: string | null;
}

export function ResponsePair({
    leftContent,
    rightContent,
    leftDone,
    rightDone,
    leftEvaluations,
    rightEvaluations,
    expectedEvalCount,
    phase,
    preference,
    onPreferLeft,
    onPreferRight,
    leftRevealedPrompt,
    rightRevealedPrompt,
    leftRevealedLabel,
    rightRevealedLabel
}: ResponsePairProps) {
    return (
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <ResponsePanel
                side='left'
                content={leftContent}
                done={leftDone}
                evaluations={leftEvaluations}
                expectedEvalCount={expectedEvalCount}
                phase={phase}
                preference={preference}
                onPrefer={onPreferLeft}
                revealedPrompt={leftRevealedPrompt}
                revealedLabel={leftRevealedLabel}
            />
            <ResponsePanel
                side='right'
                content={rightContent}
                done={rightDone}
                evaluations={rightEvaluations}
                expectedEvalCount={expectedEvalCount}
                phase={phase}
                preference={preference}
                onPrefer={onPreferRight}
                revealedPrompt={rightRevealedPrompt}
                revealedLabel={rightRevealedLabel}
            />
        </div>
    );
}
