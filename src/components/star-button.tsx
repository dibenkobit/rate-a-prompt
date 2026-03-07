'use client';

import { StarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const REPO = 'dibenkobit/rate-a-prompt';
const GITHUB_URL = `https://github.com/${REPO}`;

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

export function StarButton({ className }: { className?: string }) {
    const stars = useStarCount();

    return (
        <Button
            variant='outline'
            size='sm'
            className={`h-auto gap-1.5 py-1.5 ${className ?? ''}`}
            render={(props) => <a {...props} href={GITHUB_URL} target='_blank' rel='noopener noreferrer' />}
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
        </Button>
    );
}
