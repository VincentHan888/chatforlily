'use client';

import { startTransition, useMemo, useOptimistic, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { promptTemplates, DEFAULT_PROMPT_ID } from '@/lib/prompts';
import { cn } from '@/lib/utils';
import { CheckCircleFillIcon, ChevronDownIcon } from './icons';

export function PromptSelector({
  selectedPromptId,
  onPromptChange,
  className,
}: {
  selectedPromptId: string;
  onPromptChange: (promptId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [optimisticPromptId, setOptimisticPromptId] =
    useOptimistic(selectedPromptId);

  const selectedPrompt = useMemo(
    () => promptTemplates.find((prompt) => prompt.id === optimisticPromptId),
    [optimisticPromptId],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          data-testid="prompt-selector"
          variant="outline"
          className="md:px-2 md:h-[34px]"
        >
          {selectedPrompt?.name || '选择预设'}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[300px]">
        {promptTemplates.map((prompt) => {
          const { id } = prompt;

          return (
            <DropdownMenuItem
              data-testid={`prompt-selector-item-${id}`}
              key={id}
              onSelect={() => {
                setOpen(false);

                startTransition(() => {
                  setOptimisticPromptId(id);
                  onPromptChange(id);
                });
              }}
              data-active={id === optimisticPromptId}
              asChild
            >
              <button
                type="button"
                className="gap-4 group/item flex flex-row justify-between items-center w-full"
              >
                <div className="flex flex-col gap-1 items-start">
                  <div className="flex items-center gap-2">{prompt.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {prompt.description}
                  </div>
                </div>

                <div className="text-foreground dark:text-foreground opacity-0 group-data-[active=true]/item:opacity-100">
                  <CheckCircleFillIcon />
                </div>
              </button>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
