'use client';

import type { ResponseState } from '@/lib/types';
import { ComparisonPhase } from '@/lib/types';
import { ResponsePanel } from './response-panel';

interface RevealedPrompt {
    label: string;
    text: string;
}

interface ResponsePairProps {
    responses: ResponseState[];
    expectedEvalCount: number;
    phase: ComparisonPhase;
    preference: number | null;
    onPrefer: (index: number) => void;
    onRetryResponse: (index: number) => void;
    onRetryEvaluation: (responseIndex: number, evaluatorModel: string) => void;
    revealedPrompts: RevealedPrompt[] | null;
    gridCols: string;
}

export function ResponsePair({
    responses,
    expectedEvalCount,
    phase,
    preference,
    onPrefer,
    onRetryResponse,
    onRetryEvaluation,
    revealedPrompts,
    gridCols
}: ResponsePairProps) {
    return (
        <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
            {responses.map((response, i) => (
                <ResponsePanel
                    key={i}
                    index={i}
                    content={response.content}
                    done={response.done}
                    error={response.error}
                    evaluations={response.evaluations}
                    expectedEvalCount={expectedEvalCount}
                    startedAt={response.startedAt}
                    completedAt={response.completedAt}
                    phase={phase}
                    isPreferred={preference === i}
                    showPreferButton={
                        (phase === ComparisonPhase.Streaming || phase === ComparisonPhase.Responded) &&
                        preference === null &&
                        response.content.length > 0
                    }
                    onPrefer={() => onPrefer(i)}
                    onRetryResponse={() => onRetryResponse(i)}
                    onRetryEvaluation={(evaluatorModel) => onRetryEvaluation(i, evaluatorModel)}
                    revealedPrompt={revealedPrompts?.[i]?.text ?? null}
                    revealedLabel={revealedPrompts?.[i]?.label ?? null}
                />
            ))}
        </div>
    );
}
