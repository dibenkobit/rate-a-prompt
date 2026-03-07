'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
    persistent: boolean;
    onSave: (key: string, persist: boolean) => void;
}

export function ApiKeyDialog({ open, onOpenChange, apiKey, persistent, onSave }: ApiKeyDialogProps) {
    const [value, setValue] = useState(apiKey);
    const [persist, setPersist] = useState(persistent);

    function handleSave() {
        onSave(value.trim(), persist);
        onOpenChange(false);
    }

    function handleClear() {
        onSave('', persist);
        setValue('');
        onOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='sm:max-w-md'>
                <DialogHeader>
                    <DialogTitle>OpenRouter API Key</DialogTitle>
                    <DialogDescription>
                        Your key never leaves your browser — it is stored on your device and sent directly to
                        OpenRouter. We do not have access to it.
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
                <div className='flex items-start gap-2'>
                    <Checkbox
                        id='persist-key'
                        checked={persist}
                        onCheckedChange={(checked) => setPersist(checked === true)}
                    />
                    <label htmlFor='persist-key' className='flex flex-col gap-0.5 text-sm leading-none'>
                        <span>Remember my key across sessions (local storage)</span>
                        <span className='text-xs font-normal text-muted-foreground'>
                            When unchecked, your key is forgotten when you close this tab (session storage).
                        </span>
                    </label>
                </div>
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
