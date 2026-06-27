import type { TRPCError } from '@trpc/server';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_GENERATION_URL = 'https://openrouter.ai/api/v1/generation';
export const OPENROUTER_TIMEOUT = 30_000;
// Streaming uses an idle timeout (reset on each chunk), not a total-duration cap,
// so long generations aren't killed mid-stream while data is still flowing.
export const OPENROUTER_STREAM_IDLE_TIMEOUT = 120_000;

export function mapHttpStatusToTRPCCode(status: number): TRPCError['code'] {
    if (status >= 500) return 'INTERNAL_SERVER_ERROR';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 429) return 'TOO_MANY_REQUESTS';
    return 'BAD_REQUEST';
}
