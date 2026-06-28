/**
 * Single source of truth for site-wide metadata, used by the Next.js Metadata
 * API (layout, sitemap, robots, manifest, OG image) and the UI footer/header.
 */

const REPO = 'dibenkobit/rate-a-prompt';

export const SITE = {
    name: 'Rate a Prompt',
    /** Production origin — no trailing slash. */
    url: 'https://rateaprompt.dibenko.com',
    title: 'Rate a Prompt — Compare System Prompts Side-by-Side',
    tagline: 'Compare system prompts side-by-side',
    description:
        'Compare two system prompts side-by-side with real AI model responses and automated 0–10 evaluations. Free, open-source, and bring your own OpenRouter key.',
    /** Topical keywords — kept relevant, not stuffed. */
    keywords: [
        'prompt comparison',
        'system prompt',
        'compare prompts',
        'prompt engineering',
        'LLM evaluation',
        'prompt testing',
        'prompt evaluator',
        'A/B test prompts',
        'AI model comparison',
        'OpenRouter',
        'ChatGPT prompt',
        'LLM playground'
    ],
    repo: REPO,
    githubUrl: `https://github.com/${REPO}`,
    author: {
        name: 'Nikita Snetkov',
        url: 'https://github.com/dibenkobit'
    },
    locale: 'en_US',
    /** Brand emerald — drives theme-color and the OG image accent. */
    themeColor: '#10b981'
} as const;
