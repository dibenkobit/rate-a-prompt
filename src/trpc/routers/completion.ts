import { TRPCError } from '@trpc/server';
import { mapHttpStatusToTRPCCode, OPENROUTER_STREAM_IDLE_TIMEOUT, OPENROUTER_URL } from '@/lib/openrouter';
import { completionInputSchema } from '@/lib/schemas';
import { authedProcedure, router } from '../init';

export const completionRouter = router({
    generate: authedProcedure.input(completionInputSchema).query(async function* ({ input, ctx, signal }) {
        const controller = new AbortController();
        let idleTimer: ReturnType<typeof setTimeout> | undefined;
        const resetIdle = () => {
            if (idleTimer) clearTimeout(idleTimer);
            idleTimer = setTimeout(() => controller.abort(), OPENROUTER_STREAM_IDLE_TIMEOUT);
        };
        const abortSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

        try {
            resetIdle();
            const response = await fetch(OPENROUTER_URL, {
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
                throw new TRPCError({
                    code: mapHttpStatusToTRPCCode(response.status),
                    message: `OpenRouter error: ${response.status} ${errorText}`
                });
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No response body' });
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let generationId: string | null = null;

            try {
                while (true) {
                    if (abortSignal.aborted) return;

                    const { done, value } = await reader.read();
                    resetIdle();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() ?? '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed?.startsWith('data: ')) continue;
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
                            if (!generationId && parsed.id) {
                                generationId = parsed.id;
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
                if (idleTimer) clearTimeout(idleTimer);
                await reader.cancel().catch(() => {});
                if (generationId) {
                    yield { type: 'generationId' as const, generationId };
                }
            }
        } catch (error) {
            if (idleTimer) clearTimeout(idleTimer);
            if (error instanceof TRPCError) throw error;
            if (error instanceof DOMException && error.name === 'AbortError') {
                if (signal?.aborted) return;
                const idleSeconds = OPENROUTER_STREAM_IDLE_TIMEOUT / 1000;
                console.error(`[completion] Idle timeout after ${idleSeconds}s | model=${input.model}`);
                throw new TRPCError({
                    code: 'TIMEOUT',
                    message: `Response stalled — no data for ${idleSeconds} seconds`
                });
            }
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: error instanceof Error ? error.message : 'Unknown completion error'
            });
        }
    })
});
