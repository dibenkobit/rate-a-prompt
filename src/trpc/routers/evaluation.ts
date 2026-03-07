import { TRPCError } from '@trpc/server';
import { EVALUATION_SYSTEM_PROMPT } from '@/lib/constants';
import { evaluationInputSchema } from '@/lib/schemas';
import { authedProcedure, router } from '../init';

export const evaluationRouter = router({
    evaluate: authedProcedure.input(evaluationInputSchema).mutation(async ({ input, ctx }) => {
        try {
            const userPrompt = `**User's Question:**
${input.userMessage}

**System Prompt Used:**
${input.systemPrompt}

**AI Response to Evaluate:**
${input.response}`;

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ctx.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: input.model,
                    messages: [
                        { role: 'system', content: EVALUATION_SYSTEM_PROMPT },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: 'json_object' }
                }),
                signal: AbortSignal.timeout(30_000)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `[evaluation] OpenRouter error ${response.status} | model=${input.model} | ${errorText.slice(0, 200)}`
                );
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `OpenRouter error: ${response.status} ${errorText}`
                });
            }

            const data = await response.json();
            const raw = data.choices?.[0]?.message?.content ?? '';

            try {
                const parsed = JSON.parse(raw);
                return {
                    score: Number(parsed.score),
                    reasoning: String(parsed.reasoning ?? '')
                };
            } catch {
                const scoreMatch = raw.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/);
                const reasoningMatch = raw.match(/"reasoning"\s*:\s*"([^"]+)"/);

                if (scoreMatch) {
                    return {
                        score: Number(scoreMatch[1]),
                        reasoning: reasoningMatch?.[1] ?? ''
                    };
                }

                console.error(`[evaluation] Parse error | model=${input.model} | raw=${raw.slice(0, 200)}`);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: `Failed to parse evaluation response: ${raw}`
                });
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.error(`[evaluation] Timeout after 30s | model=${input.model}`);
                throw new TRPCError({ code: 'TIMEOUT', message: 'Evaluation timed out after 30 seconds' });
            }
            throw error;
        }
    })
});
