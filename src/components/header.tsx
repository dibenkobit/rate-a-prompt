'use client';

import { KeyIcon } from 'lucide-react';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';

interface HeaderProps {
    hasApiKey: boolean;
    onOpenApiKeyDialog: () => void;
}

export function Header({ hasApiKey, onOpenApiKeyDialog }: HeaderProps) {
    return (
        <header className='flex items-center justify-between border-b px-4 py-3'>
            <h1 className='text-lg font-semibold tracking-tight'>Rate a Prompt</h1>
            <div className='flex items-center gap-2'>
                <Button variant='outline' size='sm' className='gap-1.5' onClick={onOpenApiKeyDialog}>
                    <KeyIcon className='size-3.5' />
                    <span className='text-xs'>{hasApiKey ? 'API Key Set' : 'Set API Key'}</span>
                    {hasApiKey && <span className='size-1.5 rounded-full bg-emerald-500' />}
                </Button>
                <ModeToggle />
            </div>
        </header>
    );
}
