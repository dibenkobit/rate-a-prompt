import { createTRPCClient, httpBatchStreamLink, httpLink, splitLink } from '@trpc/client';
import superjson from 'superjson';
import { getApiKey } from '@/hooks/use-api-key';
import type { AppRouter } from './routers/_app';

let client: ReturnType<typeof createTRPCClient<AppRouter>>;

const commonOptions = {
    url: '/api/trpc',
    transformer: superjson,
    headers: () => ({
        'x-openrouter-key': getApiKey()
    })
};

export function api() {
    if (!client) {
        client = createTRPCClient<AppRouter>({
            links: [
                splitLink({
                    condition: (op) => op.type === 'mutation',
                    true: httpLink(commonOptions),
                    false: httpBatchStreamLink(commonOptions)
                })
            ]
        });
    }
    return client;
}
