import { TRPCError } from '@trpc/server';
import { completionInputSchema } from '@/lib/schemas';
import { authedProcedure, router } from '../init';

export const completionRouter = router({
    generate: authedProcedure.input(completionInputSchema).query(async function* ({ input, ctx, signal }) {
        const timeoutSignal = AbortSignal.timeout(30_000);
        const abortSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal;

        try {
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${ctx.apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: abortSignal,
                body: JSON.stringify({
                    model: input.model,
                    stream: true,
                    messages: [
                        { role: 'system', content: input.systemPrompt },
                        { role: 'user', content: input.userMessage }
                    ]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(
                    `[completion] OpenRouter error ${response.status} | model=${input.model} | ${errorText.slice(0, 200)}`
                );
                const code =
                    response.status >= 500
                        ? 'INTERNAL_SERVER_ERROR'
                        : response.status === 401
                          ? 'UNAUTHORIZED'
                          : response.status === 429
                            ? 'TOO_MANY_REQUESTS'
                            : 'BAD_REQUEST';
                throw new TRPCError({
                    code,
                    message: `OpenRouter error: ${response.status} ${errorText}`
                });
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No response body' });
            }

            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    if (abortSignal.aborted) return;

                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || !trimmed.startsWith('data: ')) continue;
                        const data = trimmed.slice(6);
                        if (data === '[DONE]') return;

                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.error) {
                                const msg =
                                    typeof parsed.error === 'string'
                                        ? parsed.error
                                        : (parsed.error.message ?? JSON.stringify(parsed.error));
                                console.error(
                                    `[completion] Stream error | model=${input.model} | ${msg.slice(0, 200)}`
                                );
                                throw new TRPCError({
                                    code: 'INTERNAL_SERVER_ERROR',
                                    message: `OpenRouter stream error: ${msg}`
                                });
                            }
                            const content = parsed.choices?.[0]?.delta?.content;
                            if (content) {
                                yield { type: 'delta' as const, content };
                            }
                        } catch (e) {
                            if (e instanceof TRPCError) throw e;
                            // skip unparseable SSE chunks
                        }
                    }
                }
            } finally {
                await reader.cancel().catch(() => {});
            }
        } catch (error) {
            if (error instanceof TRPCError) throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                if (signal?.aborted) return;
                console.error(`[completion] Timeout after 30s | model=${input.model}`);
                throw new TRPCError({ code: 'TIMEOUT', message: 'Response timed out after 30 seconds' });
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Unknown completion error'
            });
        }
    })
});
