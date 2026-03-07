'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

interface ApiKeyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    apiKey: string;
    onSave: (key: string) => void;
}

export function ApiKeyDialog({ open, onOpenChange, apiKey, onSave }: ApiKeyDialogProps) {
    const [value, setValue] = useState(apiKey);

    function handleSave() {
        onSave(value.trim());
        onOpenChange(false);
    }

    function handleClear() {
        onSave('');
        setValue('');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>OpenRouter API Key</DialogTitle>
                    <DialogDescription>
                        Your API key is stored locally in your browser and sent directly to OpenRouter. It is never
                        stored on any server.
                    </DialogDescription>
                </DialogHeader>
                <input
                    type='password'
                    placeholder='sk-or-...'
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className='h-9 w-full rounded-md border bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring'
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave();
                    }}
                />
                <DialogFooter className='gap-2 sm:gap-0'>
                    {apiKey && (
                        <Button variant='destructive' size='sm' onClick={handleClear}>
                            Clear Key
                        </Button>
                    )}
                    <Button size='sm' onClick={handleSave} disabled={!value.trim()}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
