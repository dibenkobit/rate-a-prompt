import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: SITE.title,
        short_name: SITE.name,
        description: SITE.description,
        start_url: '/',
        display: 'standalone',
        background_color: '#0a0a0a',
        theme_color: '#0a0a0a',
        categories: ['developer', 'productivity', 'utilities'],
        icons: [
            { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
            { src: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' }
        ]
    };
}
