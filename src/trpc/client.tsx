import { createTRPCClient, httpBatchStreamLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from './routers/_app';

function getApiKey(): string {
	if (typeof window === 'undefined') return '';
	return localStorage.getItem('openrouter-api-key') ?? '';
}

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
