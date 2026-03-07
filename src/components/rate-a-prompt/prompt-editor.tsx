'use client';

import { XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodeMirrorEditor } from './codemirror-editor';

interface PromptEditorProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    onRemove?: () => void;
}

export function PromptEditor({ label, value, onChange, disabled, onRemove }: PromptEditorProps) {
    return (
        <div className='flex flex-1 flex-col gap-2'>
            <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-muted-foreground'>{label}</span>
                {onRemove && (
                    <Button
                        variant='ghost'
                        size='icon'
                        className='size-6'
                        onClick={onRemove}
                        aria-label={`Remove ${label}`}
                    >
                        <XIcon className='size-3.5' />
                    </Button>
                )}
            </div>
            <CodeMirrorEditor
                placeholder='Enter your system prompt here...'
                value={value}
                onChange={onChange}
                disabled={disabled}
            />
        </div>
    );
}
