import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Allow every crawler, including AI training/answer bots (GPTBot, ClaudeBot,
// Google-Extended, PerplexityBot, …). Only the POST-only tRPC API is excluded.
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/'
        },
        sitemap: `${SITE.url}/sitemap.xml`,
        host: SITE.url
    };
}
