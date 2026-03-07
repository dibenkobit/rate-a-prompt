'use client';

import { ChevronDownIcon, PlusIcon, XIcon } from 'lucide-react';
import { useState } from 'react';
import {
    ModelSelector,
    ModelSelectorContent,
    ModelSelectorEmpty,
    ModelSelectorGroup,
    ModelSelectorInput,
    ModelSelectorItem,
    ModelSelectorList,
    ModelSelectorLogo,
    ModelSelectorLogoGroup,
    ModelSelectorName,
    ModelSelectorTrigger
} from '@/components/ai-elements/model-selector';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GROUPED_MODELS, MODEL_BY_ID } from '@/lib/constants';
import type { ModelInfo } from '@/lib/types';

interface ModelPickerSingleProps {
    multiple?: false;
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
}

interface ModelPickerMultiProps {
    multiple: true;
    value: string[];
    onValueChange: (value: string[]) => void;
    max?: number;
    disabled?: boolean;
}

type ModelPickerProps = ModelPickerSingleProps | ModelPickerMultiProps;

export function ModelPicker(props: ModelPickerProps) {
    const [open, setOpen] = useState(false);

    if (props.multiple) {
        return <MultiModelPicker {...props} open={open} onOpenChange={setOpen} />;
    }
    return <SingleModelPicker {...props} open={open} onOpenChange={setOpen} />;
}

interface OpenState {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

function SingleModelPicker({ value, onValueChange, disabled, open, onOpenChange }: ModelPickerSingleProps & OpenState) {
    const selectedModel = MODEL_BY_ID.get(value) ?? null;
    const [customId, setCustomId] = useState('');

    return (
        <ModelSelector open={open} onOpenChange={onOpenChange}>
            <ModelSelectorTrigger
                disabled={disabled}
                render={(props) => <Button {...props} variant='outline' size='sm' />}
            >
                {selectedModel ? (
                    <>
                        <ModelSelectorLogo provider={selectedModel.logoProvider} />
                        <ModelSelectorName className='text-xs'>{selectedModel.name}</ModelSelectorName>
                    </>
                ) : value ? (
                    <span className='text-xs'>{value}</span>
                ) : (
                    <span className='text-muted-foreground'>Select model...</span>
                )}
                <ChevronDownIcon className='size-3 text-muted-foreground' />
            </ModelSelectorTrigger>
            <ModelSelectorContent side='bottom'>
                <ModelSelectorInput placeholder='Search models...' />
                <ModelSelectorList>
                    <ModelSelectorEmpty>No models found</ModelSelectorEmpty>
                    {Object.entries(GROUPED_MODELS).map(([provider, models]) => (
                        <ModelSelectorGroup key={provider} heading={provider}>
                            {models.map((model) => (
                                <ModelSelectorItem
                                    key={model.id}
                                    value={model.name}
                                    data-checked={model.id === value || undefined}
                                    onSelect={() => {
                                        onValueChange(model.id);
                                        onOpenChange(false);
                                    }}
                                >
                                    <ModelSelectorLogo provider={model.logoProvider} />
                                    <ModelSelectorName className='text-xs'>{model.name}</ModelSelectorName>
                                </ModelSelectorItem>
                            ))}
                        </ModelSelectorGroup>
                    ))}
                </ModelSelectorList>
                <div className='border-t p-2'>
                    <div className='flex items-center gap-1'>
                        <input
                            type='text'
                            placeholder='Custom model ID...'
                            value={customId}
                            onChange={(e) => setCustomId(e.target.value)}
                            className='h-7 flex-1 rounded-md border bg-transparent px-2 text-xs placeholder:text-muted-foreground focus:outline-none'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && customId.trim()) {
                                    onValueChange(customId.trim());
                                    setCustomId('');
                                    onOpenChange(false);
                                }
                            }}
                        />
                        <Button
                            variant='outline'
                            size='icon-sm'
                            disabled={!customId.trim()}
                            onClick={() => {
                                if (customId.trim()) {
                                    onValueChange(customId.trim());
                                    setCustomId('');
                                    onOpenChange(false);
                                }
                            }}
                        >
                            <PlusIcon className='size-3' />
                        </Button>
                    </div>
                </div>
            </ModelSelectorContent>
        </ModelSelector>
    );
}

function MultiModelPicker({
    value,
    onValueChange,
    max = 5,
    disabled,
    open,
    onOpenChange
}: ModelPickerMultiProps & OpenState) {
    const selected = new Set(value);
    const atMax = selected.size >= max;
    const selectedModels = value.map((id) => MODEL_BY_ID.get(id)).filter(Boolean) as ModelInfo[];
    const [customId, setCustomId] = useState('');

    function toggle(modelId: string) {
        if (selected.has(modelId)) {
            onValueChange(value.filter((id) => id !== modelId));
        } else if (!atMax) {
            onValueChange([...value, modelId]);
        }
    }

    return (
        <ModelSelector open={open} onOpenChange={onOpenChange}>
            <ModelSelectorTrigger
                disabled={disabled}
                render={(props) => <Button {...props} variant='outline' size='sm' />}
            >
                {selectedModels.length > 0 ? (
                    <>
                        <ModelSelectorLogoGroup>
                            {selectedModels.map((m) => (
                                <ModelSelectorLogo key={m.id} provider={m.logoProvider} />
                            ))}
                        </ModelSelectorLogoGroup>
                        <span className='text-xs'>
                            {selectedModels.length} {selectedModels.length === 1 ? 'model' : 'models'}
                        </span>
                    </>
                ) : value.length > 0 ? (
                    <span className='text-xs'>
                        {value.length} custom {value.length === 1 ? 'model' : 'models'}
                    </span>
                ) : (
                    <span className='text-muted-foreground'>Select evaluators...</span>
                )}
                <ChevronDownIcon className='size-3 text-muted-foreground' />
            </ModelSelectorTrigger>
            <ModelSelectorContent side='bottom'>
                <ModelSelectorInput placeholder='Search models...' />
                <div className='border-b px-2 py-2'>
                    <div className='mb-1.5 flex items-center justify-between'>
                        <span className='text-[10px] text-muted-foreground'>
                            {selected.size}/{max} selected
                        </span>
                        {value.length > 0 && (
                            <Button
                                variant='link'
                                className='h-auto p-0 text-[10px] text-muted-foreground'
                                onClick={() => onValueChange([])}
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                    {selectedModels.length > 0 || value.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                            {value.map((id) => {
                                const m = MODEL_BY_ID.get(id);
                                return (
                                    <Badge key={id} variant='secondary' className='gap-1 pr-1 text-[10px]'>
                                        {m ? (
                                            <>
                                                <ModelSelectorLogo provider={m.logoProvider} />
                                                {m.name}
                                            </>
                                        ) : (
                                            <span className='truncate max-w-24'>{id}</span>
                                        )}
                                        <button
                                            type='button'
                                            className='ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20'
                                            onClick={() => toggle(id)}
                                        >
                                            <span className='sr-only'>Remove</span>
                                            <XIcon className='size-2.5' />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                    ) : (
                        <p className='text-[10px] text-muted-foreground/70'>No evaluator models selected.</p>
                    )}
                </div>
                <ModelSelectorList>
                    <ModelSelectorEmpty>No models found</ModelSelectorEmpty>
                    {Object.entries(GROUPED_MODELS).map(([provider, models]) => (
                        <ModelSelectorGroup key={provider} heading={provider}>
                            {models.map((model) => {
                                const isSelected = selected.has(model.id);
                                const isDisabledItem = !isSelected && atMax;
                                return (
                                    <ModelSelectorItem
                                        key={model.id}
                                        value={model.name}
                                        disabled={isDisabledItem}
                                        data-checked={isSelected || undefined}
                                        onSelect={() => toggle(model.id)}
                                    >
                                        <ModelSelectorLogo provider={model.logoProvider} />
                                        <ModelSelectorName className='text-xs'>{model.name}</ModelSelectorName>
                                    </ModelSelectorItem>
                                );
                            })}
                        </ModelSelectorGroup>
                    ))}
                </ModelSelectorList>
                <div className='border-t p-2'>
                    <div className='flex items-center gap-1'>
                        <input
                            type='text'
                            placeholder='Custom model ID...'
                            value={customId}
                            onChange={(e) => setCustomId(e.target.value)}
                            className='h-7 flex-1 rounded-md border bg-transparent px-2 text-xs placeholder:text-muted-foreground focus:outline-none'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && customId.trim() && !atMax) {
                                    toggle(customId.trim());
                                    setCustomId('');
                                }
                            }}
                        />
                        <Button
                            variant='outline'
                            size='icon-sm'
                            disabled={!customId.trim() || atMax}
                            onClick={() => {
                                if (customId.trim() && !atMax) {
                                    toggle(customId.trim());
                                    setCustomId('');
                                }
                            }}
                        >
                            <PlusIcon className='size-3' />
                        </Button>
                    </div>
                </div>
            </ModelSelectorContent>
        </ModelSelector>
    );
}
