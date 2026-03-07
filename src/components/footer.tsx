'use client';

import { StarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const REPO = 'dibenkobit/rate-a-prompt';
const GITHUB_URL = `https://github.com/${REPO}`;
const TWITTER_URL = 'https://x.com/dibenkobit';

function useStarCount() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        fetch(`https://api.github.com/repos/${REPO}`)
            .then((r) => r.json())
            .then((data) => {
                if (typeof data.stargazers_count === 'number') {
                    setCount(data.stargazers_count);
                }
            })
            .catch(() => {});
    }, []);

    return count;
}

export function Footer() {
    const stars = useStarCount();

    return (
        <footer className='px-4 py-16'>
            <div className='mx-auto max-w-7xl'>
                <div className='flex flex-col gap-10 sm:flex-row sm:justify-between'>
                    {/* Branding */}
                    <div className='flex max-w-sm flex-col gap-3'>
                        <p className='text-lg font-semibold tracking-tight'>Rate a Prompt</p>
                        <p className='text-sm text-muted-foreground'>
                            Open-source prompt comparison tool. Evaluate and compare LLM outputs side by side.
                        </p>
                        <a
                            href={GITHUB_URL}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={buttonVariants({
                                variant: 'outline',
                                size: 'sm',
                                className: 'mt-2 h-auto w-fit gap-1.5 py-1.5'
                            })}
                        >
                            <StarIcon className='size-3.5' />
                            <span className='text-xs'>Star on GitHub</span>
                            {stars !== null ? (
                                <span className='rounded-md bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground'>
                                    {stars.toLocaleString()}
                                </span>
                            ) : (
                                <Skeleton className='h-[18px] w-6 rounded-md' />
                            )}
                        </a>
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

                        {/* Connect */}
                        <div className='flex flex-col gap-3'>
                            <p className='text-sm font-semibold'>Connect</p>
                            <nav className='flex flex-col gap-2'>
                                <a
                                    href={TWITTER_URL}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                                >
                                    X (Twitter)
                                </a>
                                <a
                                    href={`${GITHUB_URL}/discussions`}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                                >
                                    Discussions
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
                            href='https://github.com/dibenkobit'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground'
                        >
                            Nikita Snetkov
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
