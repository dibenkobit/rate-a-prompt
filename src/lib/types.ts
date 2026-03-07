export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    logoProvider: string;
}

export interface ComparisonConfig {
    model: string;
    evaluatorModels: string[];
    shuffle: boolean;
    webSearch: boolean;
}

export const ComparisonPhase = {
    Editing: 'editing',
    Streaming: 'streaming',
    Responded: 'responded',
    Revealed: 'revealed'
} as const;

export type ComparisonPhase = (typeof ComparisonPhase)[keyof typeof ComparisonPhase];

export interface EvaluationResult {
    evaluatorModel: string;
    score: number;
    reasoning: string;
}

export interface ResponseState {
    content: string;
    done: boolean;
    error: string | null;
    evaluations: EvaluationResult[];
    startedAt: number | null;
    completedAt: number | null;
    cost: number | null;
}
