import { ArrowRightIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from '@/lib/guides';
import { SITE } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Guides — Prompt Engineering & Comparison',
    description:
        'Practical, no-fluff guides on writing system prompts, comparing prompt variants, and prompt A/B testing — from the team behind Rate a Prompt.',
    alternates: { canonical: '/guides' }
};

export default function GuidesIndexPage() {
    return (
        <div className='mx-auto max-w-2xl'>
            <h1 className='text-3xl font-semibold tracking-tight'>Guides</h1>
            <p className='mt-3 text-muted-foreground'>
                Practical, no-fluff guides on writing system prompts and comparing them properly. Then put them to work
                in the{' '}
                <Link href='/' className='underline underline-offset-4 hover:text-foreground'>
                    side-by-side comparison tool
                </Link>
                .
            </p>

            <ul className='mt-10 flex flex-col gap-4'>
                {GUIDES.map((guide) => (
                    <li key={guide.slug}>
                        <Link
                            href={`/guides/${guide.slug}`}
                            className='group block rounded-xl border p-5 transition-colors hover:border-foreground/30 hover:bg-muted/40'
                        >
                            <div className='flex items-center justify-between gap-3'>
                                <h2 className='font-medium tracking-tight'>{guide.title}</h2>
                                <ArrowRightIcon className='size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
                            </div>
                            <p className='mt-2 text-sm text-muted-foreground'>{guide.description}</p>
                        </Link>
                    </li>
                ))}
            </ul>

            <p className='mt-10 text-sm text-muted-foreground'>
                Rate a Prompt is free and open-source.{' '}
                <a
                    href={SITE.githubUrl}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline underline-offset-4 hover:text-foreground'
                >
                    Star it on GitHub
                </a>
                .
            </p>
        </div>
    );
}
