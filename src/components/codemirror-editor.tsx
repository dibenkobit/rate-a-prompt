'use client';

import { markdown } from '@codemirror/lang-markdown';
import { yaml } from '@codemirror/lang-yaml';
import { githubDarkInit } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { detectLanguage } from '@/lib/detect-language';
import { cn } from '@/lib/utils';

interface CodeMirrorEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function CodeMirrorEditor({ value, onChange, disabled, placeholder, className }: CodeMirrorEditorProps) {
    const lang = useMemo(() => detectLanguage(value), [value]);
    const extensions = useMemo(() => [lang === 'yaml' ? yaml() : markdown()], [lang]);

    return (
        <CodeMirror
            value={value}
            onChange={onChange}
            extensions={extensions}
            theme={githubDarkInit({ settings: { background: 'lab(7.78201 -0.0000149012 0)' } })}
            editable={!disabled}
            placeholder={placeholder}
            basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                highlightSelectionMatches: false,
                indentOnInput: true,
                autocompletion: false
            }}
            className={cn(
                'overflow-hidden rounded-lg border border-input text-sm [&_.cm-editor]:font-mono [&_.cm-editor.cm-focused]:outline-none [&_.cm-scroller]:min-h-[200px] [&_.cm-scroller]:max-h-[400px]',
                'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
                disabled && 'cursor-not-allowed opacity-50',
                className
            )}
        />
    );
}
