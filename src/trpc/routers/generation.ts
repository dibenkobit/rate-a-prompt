import { TRPCError } from '@trpc/server';
import { mapHttpStatusToTRPCCode, OPENROUTER_GENERATION_URL, OPENROUTER_TIMEOUT } from '@/lib/openrouter';
import { generationInputSchema } from '@/lib/schemas';
import { authedProcedure, router } from '../init';

export const generationRouter = router({
    getCost: authedProcedure.input(generationInputSchema).mutation(async ({ input, ctx }) => {
        try {
            const url = `${OPENROUTER_GENERATION_URL}?id=${encodeURIComponent(input.generationId)}`;
            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${ctx.apiKey}` },
                signal: AbortSignal.timeout(OPENROUTER_TIMEOUT)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `[generation] OpenRouter error ${response.status} | id=${input.generationId} | ${errorText.slice(0, 200)}`
                );
                throw new TRPCError({
                    code: mapHttpStatusToTRPCCode(response.status),
                    message: `OpenRouter error: ${response.status} ${errorText}`
                });
            }

            const data = (await response.json()) as { data?: { total_cost?: number } };
            return { totalCost: data.data?.total_cost ?? null };
        } catch (error) {
            if (error instanceof TRPCError) throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.error(`[generation] Timeout | id=${input.generationId}`);
                throw new TRPCError({ code: 'TIMEOUT', message: 'Generation stats request timed out' });
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Unknown error fetching generation stats'
            });
        }
    })
});
