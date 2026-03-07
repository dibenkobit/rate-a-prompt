'use client';

import type { ComparisonPhase, ResponseState } from '@/lib/types';
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
    revealedPrompts: RevealedPrompt[] | null;
    gridCols: string;
}

export function ResponsePair({
    responses,
    expectedEvalCount,
    phase,
    preference,
    onPrefer,
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
                    evaluations={response.evaluations}
                    expectedEvalCount={expectedEvalCount}
                    phase={phase}
                    isPreferred={preference === i}
                    showPreferButton={phase === 'responded' && preference === null}
                    onPrefer={() => onPrefer(i)}
                    revealedPrompt={revealedPrompts?.[i]?.text ?? null}
                    revealedLabel={revealedPrompts?.[i]?.label ?? null}
                />
            ))}
        </div>
    );
}
