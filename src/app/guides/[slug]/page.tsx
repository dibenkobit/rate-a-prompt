import { ArrowRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { buttonVariants } from '@/components/ui/button-variants';
import { GUIDE_SLUGS, GUIDES, getGuide } from '@/lib/guides';
import { SITE } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
    return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const guide = getGuide(slug);
    if (!guide) return {};
    const path = `/guides/${guide.slug}`;
    return {
        title: guide.title,
        description: guide.description,
        keywords: guide.keywords,
        alternates: { canonical: path },
        openGraph: {
            type: 'article',
            url: `${SITE.url}${path}`,
            title: guide.title,
            description: guide.description
        },
        twitter: { card: 'summary_large_image', title: guide.title, description: guide.description }
    };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const guide = getGuide(slug);
    if (!guide) notFound();

    const url = `${SITE.url}/guides/${guide.slug}`;
    const related = GUIDES.filter((g) => g.slug !== guide.slug);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'TechArticle',
                headline: guide.title,
                description: guide.description,
                datePublished: guide.updated,
                dateModified: guide.updated,
                mainEntityOfPage: url,
                keywords: guide.keywords.join(', '),
                author: { '@type': 'Person', name: SITE.author.name, url: SITE.author.url },
                publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url }
            },
            {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
                    { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE.url}/guides` },
                    { '@type': 'ListItem', position: 3, name: guide.title, item: url }
                ]
            }
        ]
    };

    return (
        <article className='mx-auto max-w-2xl'>
            <nav aria-label='Breadcrumb' className='text-sm text-muted-foreground'>
                <Link href='/guides' className='underline underline-offset-4 hover:text-foreground'>
                    Guides
                </Link>
                <span className='mx-2'>/</span>
                <span className='text-foreground'>{guide.title}</span>
            </nav>

            <h1 className='mt-4 text-3xl font-semibold tracking-tight'>{guide.title}</h1>
            <p className='mt-3 text-lg text-muted-foreground'>{guide.intro}</p>

            <div className='prose prose-neutral mt-10 max-w-none dark:prose-invert'>
                {guide.sections.map((section) => (
                    <section key={section.heading}>
                        <h2>{section.heading}</h2>
                        {section.example && (
                            <div className='not-prose my-4 whitespace-pre-wrap rounded-lg border bg-muted/50 p-4 font-mono text-sm text-foreground/90'>
                                {section.example}
                            </div>
                        )}
                        {section.body?.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                        {section.bullets && (
                            <ul>
                                {section.bullets.map((bullet) => (
                                    <li key={bullet}>{bullet}</li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>

            {/* Conversion */}
            <div className='mt-12 flex flex-col items-start gap-3 rounded-xl border bg-muted/40 p-6'>
                <p className='font-medium tracking-tight'>Stop guessing — compare your prompts.</p>
                <p className='text-sm text-muted-foreground'>
                    Run two prompts on the same question, judge blind, and let AI score each answer 0–10. Free, no
                    sign-up.
                </p>
                <Link href='/' className={buttonVariants()}>
                    Compare your prompts
                    <ArrowRightIcon className='size-4' />
                </Link>
            </div>

            {/* Internal links */}
            {related.length > 0 && (
                <div className='mt-12'>
                    <h2 className='text-sm font-semibold text-muted-foreground'>Keep reading</h2>
                    <ul className='mt-3 flex flex-col gap-2'>
                        {related.map((g) => (
                            <li key={g.slug}>
                                <Link
                                    href={`/guides/${g.slug}`}
                                    className='text-sm underline underline-offset-4 hover:text-foreground'
                                >
                                    {g.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <script
                type='application/ld+json'
                // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is a static, trusted object.
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </article>
    );
}
