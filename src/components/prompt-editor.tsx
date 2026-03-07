'use client';

import { useId } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface PromptEditorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function PromptEditor({ label, value, onChange, disabled }: PromptEditorProps) {
    const id = useId();
    return (
        <div className='flex flex-1 flex-col gap-2'>
            <label htmlFor={id} className='text-sm font-medium text-muted-foreground'>
                {label}
            </label>
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
