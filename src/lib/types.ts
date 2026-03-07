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

export type ComparisonPhase = 'editing' | 'streaming' | 'responded' | 'revealed';

export interface EvaluationResult {
    evaluatorModel: string;
    score: number;
    reasoning: string;
}

export interface ResponseState {
    content: string;
    done: boolean;
    evaluations: EvaluationResult[];
}

export interface ShuffleAssignment {
    leftIsA: boolean;
}

export interface ComparisonState {
    phase: ComparisonPhase;
    promptA: string;
    promptB: string;
    userMessage: string;
    config: ComparisonConfig;
    left: ResponseState;
    right: ResponseState;
    shuffle: ShuffleAssignment;
    preference: 'left' | 'right' | null;
}
