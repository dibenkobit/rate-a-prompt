'use client';

import { StarButton } from '@/components/layout/star-button';
import { SITE } from '@/lib/site';

const GITHUB_URL = SITE.githubUrl;

export function Footer() {
    return (
        <footer className='py-16 container mx-auto'>
            <div className='flex flex-col gap-10 sm:flex-row sm:justify-between'>
                {/* Branding */}
                <div className='flex max-w-sm flex-col gap-3'>
                    <p className='text-lg font-semibold tracking-tight'>Rate a Prompt</p>
                    <p className='text-sm text-muted-foreground'>
                        Open-source prompt comparison tool. Evaluate and compare LLM outputs side by side.
                    </p>
                    <StarButton />
                </div>

                <div className='flex gap-16'>
                    {/* Project */}
                    <div className='flex flex-col gap-3'>
                        <p className='text-sm font-semibold'>Project</p>
                        <nav className='flex flex-col gap-2'>
                            <a
                                href={GITHUB_URL}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                            >
                                GitHub
                            </a>
                            <a
                                href={`${GITHUB_URL}/issues`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                            >
                                Issues
                            </a>
                            <a
                                href={`${GITHUB_URL}/releases`}
                                target='_blank'
                                rel='noopener noreferrer'
                                className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                            >
                                Releases
                            </a>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className='mt-10 flex flex-col items-start justify-between gap-2 pt-6 sm:flex-row sm:items-center'>
                <p className='text-xs text-muted-foreground'>
                    &copy; {new Date().getFullYear()} Rate a Prompt. Open source under MIT License.
                </p>
                <p className='text-xs text-muted-foreground'>
                    Built by{' '}
                    <a
                        href={SITE.author.url}
                        target='_blank'
                        rel='noopener noreferrer'
                        className='text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground'
                    >
                        {SITE.author.name}
                    </a>
                </p>
            </div>
        </footer>
    );
}
