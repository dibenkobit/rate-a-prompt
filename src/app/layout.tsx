import { Analytics } from '@vercel/analytics/next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FAQ } from '@/lib/faq';
import { SITE } from '@/lib/site';
import './globals.css';

export const metadata: Metadata = {
    metadataBase: new URL(SITE.url),
    title: {
        default: SITE.title,
        template: `%s — ${SITE.name}`
    },
    description: SITE.description,
    applicationName: SITE.name,
    keywords: [...SITE.keywords],
    authors: [{ name: SITE.author.name, url: SITE.author.url }],
    creator: SITE.author.name,
    publisher: SITE.author.name,
    category: 'technology',
    alternates: {
        canonical: '/'
    },
    openGraph: {
        type: 'website',
        url: SITE.url,
        siteName: SITE.name,
        title: SITE.title,
        description: SITE.description,
        locale: SITE.locale
    },
    twitter: {
        card: 'summary_large_image',
        title: SITE.title,
        description: SITE.description
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1
        }
    }
};

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#fafafa' },
        { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
    ]
};

const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebApplication',
            name: SITE.name,
            url: SITE.url,
            description: SITE.description,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Web',
            browserRequirements: 'Requires JavaScript and a modern web browser.',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD'
            },
            isAccessibleForFree: true,
            license: 'https://opensource.org/licenses/MIT',
            author: {
                '@type': 'Person',
                name: SITE.author.name,
                url: SITE.author.url
            },
            sameAs: [SITE.githubUrl],
            featureList: [
                'Compare two to four system prompts side-by-side',
                'Stream real AI model answers in parallel',
                'Blind preference judging with side shuffling',
                'Automated 0–10 evaluation by multiple AI models',
                'Any OpenRouter model, with optional web search',
                'Per-comparison cost tracking'
            ]
        },
        {
            '@type': 'FAQPage',
            mainEntity: FAQ.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: item.answer
                }
            }))
        }
    ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
                <ThemeProvider attribute='class' defaultTheme='dark' enableSystem disableTransitionOnChange>
                    <TooltipProvider>{children}</TooltipProvider>
                </ThemeProvider>
                <Analytics />
                <script
                    type='application/ld+json'
                    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is a static, trusted object.
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            </body>
        </html>
    );
}
