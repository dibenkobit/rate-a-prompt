import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import superjson from 'superjson';
import { getApiKey } from '@/hooks/use-api-key';
import type { AppRouter } from './routers/_app';

let client: ReturnType<typeof createTRPCClient<AppRouter>>;

export function api() {
    if (!client) {
        client = createTRPCClient<AppRouter>({
            links: [
                httpBatchStreamLink({
                    url: '/api/trpc',
                    transformer: superjson,
                    headers: () => ({
                        'x-openrouter-key': getApiKey()
                    })
                })
            ]
        });
    }
    return client;
}
