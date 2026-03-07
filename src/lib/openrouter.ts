import type { TRPCError } from '@trpc/server';

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const OPENROUTER_GENERATION_URL = 'https://openrouter.ai/api/v1/generation';
export const OPENROUTER_TIMEOUT = 30_000;

export function mapHttpStatusToTRPCCode(status: number): TRPCError['code'] {
    if (status >= 500) return 'INTERNAL_SERVER_ERROR';
    if (status === 401) return 'UNAUTHORIZED';
    if (status === 429) return 'TOO_MANY_REQUESTS';
    return 'BAD_REQUEST';
}
