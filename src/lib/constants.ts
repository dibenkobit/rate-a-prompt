import type { ModelInfo } from './types';

export const MODELS: ModelInfo[] = [
    // --- Anthropic ---
    { id: 'anthropic/claude-opus-4.6', name: 'Claude Opus 4.6', provider: 'Anthropic', logoProvider: 'anthropic' },
    { id: 'anthropic/claude-sonnet-4.6', name: 'Claude Sonnet 4.6', provider: 'Anthropic', logoProvider: 'anthropic' },
    { id: 'anthropic/claude-haiku-4.5', name: 'Claude 4.5 Haiku', provider: 'Anthropic', logoProvider: 'anthropic' },

    // --- OpenAI ---
    { id: 'openai/gpt-5.2-chat', name: 'GPT-5.2', provider: 'OpenAI', logoProvider: 'openai' },
    { id: 'openai/gpt-5', name: 'GPT-5', provider: 'OpenAI', logoProvider: 'openai' },
    { id: 'openai/gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI', logoProvider: 'openai' },

    // --- Google ---
    { id: 'google/gemini-3.1-pro', name: 'Gemini 3.1 Pro', provider: 'Google', logoProvider: 'google' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', logoProvider: 'google' },
    { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash', provider: 'Google', logoProvider: 'google' },

    // --- xAI ---
    { id: 'x-ai/grok-4', name: 'Grok 4', provider: 'xAI', logoProvider: 'xai' },
    { id: 'x-ai/grok-4-fast', name: 'Grok 4 Fast', provider: 'xAI', logoProvider: 'xai' },

    // --- DeepSeek ---
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', provider: 'DeepSeek', logoProvider: 'deepseek' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3', provider: 'DeepSeek', logoProvider: 'deepseek' },

    // --- Mistral ---
    { id: 'mistralai/mistral-large-2512', name: 'Mistral Large 3', provider: 'Mistral', logoProvider: 'mistral' },
    { id: 'mistralai/mistral-nemo', name: 'Mistral Nemo', provider: 'Mistral', logoProvider: 'mistral' }
];

export const MODEL_BY_ID = new Map(MODELS.map((m) => [m.id, m]));

export const GROUPED_MODELS: Record<string, ModelInfo[]> = {};
for (const model of MODELS) {
    if (!GROUPED_MODELS[model.provider]) {
        GROUPED_MODELS[model.provider] = [];
    }
    GROUPED_MODELS[model.provider].push(model);
}

export function getModelDisplay(modelId: string): { name: string; logo: string | null } {
    const model = MODEL_BY_ID.get(modelId);
    if (model) return { name: model.name, logo: model.logoProvider };
    const name = modelId.split('/').pop() ?? modelId;
    return { name, logo: null };
}

export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4.6';

export const EVALUATOR_PICKS = ['anthropic/claude-sonnet-4.6', 'openai/gpt-5', 'google/gemini-2.5-pro'];

export const EVALUATION_SYSTEM_PROMPT = `You are an expert AI response evaluator. Your task is to objectively evaluate the quality of an AI assistant's response to a user's question.

Evaluate the response on a scale of 0 to 10 based on:
- Accuracy: Is the information correct?
- Relevance: Does it address the question?
- Completeness: Are there important omissions?
- Clarity: Is it well-structured and clear?
- Helpfulness: Would it help the user?

You MUST respond with valid JSON in exactly this format:
{
  "score": <number 0-10>,
  "reasoning": "<1-2 sentence justification>"
}

Be strict and fair. 5 = average. 9-10 = exceptional only. 0-2 = harmful/irrelevant/wrong.`;

export const DEFAULT_CONFIG = {
    model: DEFAULT_MODEL,
    evaluatorModels: [] as string[],
    shuffle: false,
    webSearch: false
};
