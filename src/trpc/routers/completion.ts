import { TRPCError } from '@trpc/server';
import { completionInputSchema } from '@/lib/schemas';
import { authedProcedure, router } from '../init';

export const completionRouter = router({
    generate: authedProcedure.input(completionInputSchema).query(async function* ({ input, ctx }) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${ctx.apiKey}`,
                'Content-Type': 'application/json'
            },
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
            throw new TRPCError({
                code: 'BAD_REQUEST',
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
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            yield { type: 'delta' as const, content };
                        }
                    } catch {
                        // skip unparseable SSE chunks
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }
    })
});
