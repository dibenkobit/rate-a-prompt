import { TRPCError } from '@trpc/server';
import { EVALUATION_SYSTEM_PROMPT } from '@/lib/constants';
import { mapHttpStatusToTRPCCode, OPENROUTER_TIMEOUT, OPENROUTER_URL } from '@/lib/openrouter';
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

            const response = await fetch(OPENROUTER_URL, {
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
                signal: AbortSignal.timeout(OPENROUTER_TIMEOUT)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `[evaluation] OpenRouter error ${response.status} | model=${input.model} | ${errorText.slice(0, 200)}`
                );
                throw new TRPCError({
                    code: mapHttpStatusToTRPCCode(response.status),
                    message: `OpenRouter error: ${response.status} ${errorText}`
                });
            }

            let data: unknown;
            try {
                data = await response.json();
            } catch {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'OpenRouter returned invalid JSON'
                });
            }

            const raw = (data as Record<string, unknown>).choices
                ? ((data as { choices?: { message?: { content?: string } }[] }).choices?.[0]?.message?.content ?? '')
                : '';

            try {
                const parsed = JSON.parse(raw);
                const score = Number(parsed.score);
                if (!Number.isFinite(score)) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: `Invalid evaluation score: ${parsed.score}`
                    });
                }
                return {
                    score,
                    reasoning: String(parsed.reasoning ?? '')
                };
            } catch (e) {
                if (e instanceof TRPCError) throw e;
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
            if (error instanceof TRPCError) throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.error(`[evaluation] Timeout after 30s | model=${input.model}`);
                throw new TRPCError({ code: 'TIMEOUT', message: 'Evaluation timed out after 30 seconds' });
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Unknown evaluation error'
            });
        }
    })
});
