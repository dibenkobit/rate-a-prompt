'use client';

import { KeyIcon } from 'lucide-react';
import { ModeToggle } from '@/components/layout/mode-toggle';
import { StarButton } from '@/components/layout/star-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
    hasApiKey: boolean;
    onOpenApiKeyDialog: () => void;
}

export function Header({ hasApiKey, onOpenApiKeyDialog }: HeaderProps) {
    return (
        <header className='px-4 py-3'>
            <div className='mx-auto flex max-w-7xl items-center justify-between'>
                <h1 className='text-lg font-semibold tracking-tight'>Rate a Prompt</h1>
                <div className='flex items-center gap-2'>
                    <ModeToggle />
                    <Button
                        variant='outline'
                        onClick={onOpenApiKeyDialog}
                        className={cn(hasApiKey && 'border-emerald-500 dark:border-emerald-700')}
                    >
                        <KeyIcon className='size-3.5' />
                        <span className='text-xs'>{hasApiKey ? 'API Key Set' : 'Set API Key'}</span>
                    </Button>
                    <StarButton />
                </div>
            </div>
        </header>
    );
}
