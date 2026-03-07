'use client';

import { XIcon } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PromptEditorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    onRemove?: () => void;
}

export function PromptEditor({ label, value, onChange, disabled, onRemove }: PromptEditorProps) {
    const id = useId();
    return (
        <div className='flex flex-1 flex-col gap-2'>
            <div className='flex items-center justify-between'>
                <label htmlFor={id} className='text-sm font-medium text-muted-foreground'>
                    {label}
                </label>
                {onRemove && (
                    <Button variant='ghost' size='icon' className='size-6' onClick={onRemove}>
                        <XIcon className='size-3.5' />
                    </Button>
                )}
            </div>
            <Textarea
                id={id}
                placeholder='Enter your system prompt here...'
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className='min-h-[200px] max-h-[400px] flex-1 resize-none font-mono text-sm'
            />
        </div>
    );
}
