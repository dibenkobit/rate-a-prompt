import { z } from 'zod/v4';

export const completionInputSchema = z.object({
    model: z.string().min(1),
    systemPrompt: z.string().min(1),
    userMessage: z.string().min(1)
});

export const evaluationInputSchema = z.object({
    model: z.string().min(1),
    systemPrompt: z.string().min(1),
    userMessage: z.string().min(1),
    response: z.string().min(1)
});

export const generationInputSchema = z.object({
    generationId: z.string().min(1)
});

export type CompletionInput = z.infer<typeof completionInputSchema>;
export type EvaluationInput = z.infer<typeof evaluationInputSchema>;
export type GenerationInput = z.infer<typeof generationInputSchema>;
