import type { MetadataRoute } from 'next';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    return [
        { url: SITE.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
        { url: `${SITE.url}/guides`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
        ...GUIDES.map((guide) => ({
            url: `${SITE.url}/guides/${guide.slug}`,
            lastModified: new Date(guide.updated),
            changeFrequency: 'monthly' as const,
            priority: 0.7
        }))
    ];
}
