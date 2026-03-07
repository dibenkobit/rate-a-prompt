'use client';

import { SendIcon } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ConfigPanel } from './config-panel';

interface UserInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    model: string;
    onModelChange: (model: string) => void;
    evaluatorModels: string[];
    onEvaluatorModelsChange: (models: string[]) => void;
    shuffle: boolean;
    onShuffleChange: (shuffle: boolean) => void;
    webSearch: boolean;
    onWebSearchChange: (webSearch: boolean) => void;
    disabled?: boolean;
}

export function UserInput({
    value,
    onChange,
    onSend,
    model,
    onModelChange,
    evaluatorModels,
    onEvaluatorModelsChange,
    shuffle,
    onShuffleChange,
    webSearch,
    onWebSearchChange,
    disabled
}: UserInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    }

    return (
        <div className='rounded-xl border bg-card'>
            <textarea
                ref={textareaRef}
                placeholder='Type your question here...'
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                rows={3}
                className='w-full resize-none bg-transparent px-4 pt-3 pb-2 text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50'
            />
            <div className='flex items-center justify-between border-t px-3 py-2'>
                <ConfigPanel
                    model={model}
                    onModelChange={onModelChange}
                    evaluatorModels={evaluatorModels}
                    onEvaluatorModelsChange={onEvaluatorModelsChange}
                    shuffle={shuffle}
                    onShuffleChange={onShuffleChange}
                    webSearch={webSearch}
                    onWebSearchChange={onWebSearchChange}
                    disabled={disabled}
                />
                <Button onClick={onSend} disabled={disabled || !value.trim()}>
                    <SendIcon className='size-3.5' />
                    Send
                    <kbd className='pointer-events-none ml-1 hidden rounded border bg-muted px-1 font-sans text-[10px] text-muted-foreground sm:inline'>
                        ⏎
                    </kbd>
                </Button>
            </div>
        </div>
    );
}
