'use client';

import { GlobeIcon, ShuffleIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { ComparisonConfig } from '@/lib/types';
import { ModelPicker } from './model-picker';

interface ConfigPanelProps {
    config: ComparisonConfig;
    onConfigChange: (patch: Partial<ComparisonConfig>) => void;
    disabled?: boolean;
}

export function ConfigPanel({ config, onConfigChange, disabled }: ConfigPanelProps) {
    const { model, evaluatorModels, shuffle, webSearch } = config;
    return (
        <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-1.5'>
                <Label className='text-xs text-muted-foreground'>Model</Label>
                <ModelPicker value={model} onValueChange={(v) => onConfigChange({ model: v })} disabled={disabled} />
            </div>

            <div className='flex items-center gap-1.5'>
                <Label className='text-xs text-muted-foreground'>Evaluators</Label>
                <ModelPicker
                    multiple
                    value={evaluatorModels}
                    onValueChange={(v) => onConfigChange({ evaluatorModels: v })}
                    max={5}
                    disabled={disabled}
                />
            </div>

            <Tooltip>
                <TooltipTrigger render={<div className='flex items-center gap-1.5' />}>
                    <ShuffleIcon className='size-3 text-muted-foreground' />
                    <Switch
                        checked={shuffle}
                        onCheckedChange={(v) => onConfigChange({ shuffle: v })}
                        disabled={disabled}
                        aria-label='Shuffle prompt order'
                    />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Shuffle prompt sides to prevent bias</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger render={<div className='flex items-center gap-1.5' />}>
                    <GlobeIcon className='size-3 text-muted-foreground' />
                    <Switch
                        checked={webSearch}
                        onCheckedChange={(v) => onConfigChange({ webSearch: v })}
                        disabled={disabled}
                        aria-label='Enable web search'
                    />
                </TooltipTrigger>
                <TooltipContent>
                    <p>Enable web search for all models</p>
                </TooltipContent>
            </Tooltip>
        </div>
    );
}
