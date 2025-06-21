'use client';

import type { Attachment, UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { ChatHeader } from '@/components/chat-header';
import type { Vote } from '@/lib/db/schema';
import { fetcher, fetchWithErrorHandlers, generateUUID } from '@/lib/utils';
import { Artifact } from './artifact';
import { MultimodalInput } from './multimodal-input';
import { Messages } from './messages';
import type { VisibilityType } from './visibility-selector';
import { useArtifactSelector } from '@/hooks/use-artifact';
import { unstable_serialize } from 'swr/infinite';
import { getChatHistoryPaginationKey } from './sidebar-history';
import { toast } from './toast';
import type { Session } from 'next-auth';
import { useSearchParams } from 'next/navigation';
import { useChatVisibility } from '@/hooks/use-chat-visibility';
import { useAutoResume } from '@/hooks/use-auto-resume';
import { ChatSDKError } from '@/lib/errors';
import { DEFAULT_PROMPT_ID, promptTemplates } from '@/lib/prompts';

export function Chat({
  id,
  initialMessages,
  initialChatModel,
  initialVisibilityType,
  isReadonly,
  session,
  autoResume,
}: {
  id: string;
  initialMessages: Array<UIMessage>;
  initialChatModel: string;
  initialVisibilityType: VisibilityType;
  isReadonly: boolean;
  session: Session;
  autoResume: boolean;
}) {
  const { mutate } = useSWRConfig();

  const { visibilityType } = useChatVisibility({
    chatId: id,
    initialVisibilityType,
  });

  const [selectedPromptId, setSelectedPromptId] =
    useState<string>(DEFAULT_PROMPT_ID);

  const prepareRequestBody = useCallback(
    (body: any) => {
      const lastMessage = body.messages.at(-1);
      const selectedPrompt = promptTemplates.find(
        (p) => p.id === selectedPromptId,
      );

      console.log('🎯 Prompt调试信息:', {
        selectedPromptId,
        selectedPromptName: selectedPrompt?.name,
        hasPromptContent: !!selectedPrompt?.content,
        originalContent: `${lastMessage?.content?.substring(0, 100)}...`,
        isDefaultPrompt: selectedPromptId === DEFAULT_PROMPT_ID,
        promptContent: selectedPrompt?.content
          ? `${selectedPrompt.content.substring(0, 100)}...`
          : undefined,
      });

      // 如果选择了prompt且不是"无预设"，则在用户消息前添加prompt内容
      if (
        lastMessage &&
        selectedPrompt &&
        selectedPrompt.content &&
        selectedPromptId !== DEFAULT_PROMPT_ID
      ) {
        // 修改parts数组中的文本内容
        const modifiedParts =
          lastMessage.parts?.map((part: any) => {
            if (part.type === 'text') {
              return {
                ...part,
                text: selectedPrompt.content + part.text,
              };
            }
            return part;
          }) || [];

        const modifiedMessage = {
          ...lastMessage,
          content: selectedPrompt.content + lastMessage.content,
          parts: modifiedParts,
        };

        console.log(
          '✅ Prompt已应用，修改后的消息内容:',
          `${modifiedMessage.content.substring(0, 200)}...`,
        );
        console.log(
          '✅ 修改后的parts:',
          modifiedParts.map((p: any) => `${p.text?.substring(0, 100)}...`),
        );

        return {
          id,
          message: modifiedMessage,
          selectedChatModel: initialChatModel,
          selectedVisibilityType: visibilityType,
        };
      }

      console.log('ℹ️ 未应用Prompt (使用默认或无预设)');

      return {
        id,
        message: lastMessage,
        selectedChatModel: initialChatModel,
        selectedVisibilityType: visibilityType,
      };
    },
    [selectedPromptId, id, initialChatModel, visibilityType],
  );

  const {
    messages,
    setMessages,
    handleSubmit,
    input,
    setInput,
    append,
    status,
    stop,
    reload,
    experimental_resume,
    data,
  } = useChat({
    id,
    initialMessages,
    experimental_throttle: 100,
    sendExtraMessageFields: true,
    generateId: generateUUID,
    fetch: fetchWithErrorHandlers,
    experimental_prepareRequestBody: prepareRequestBody,
    onFinish: () => {
      mutate(unstable_serialize(getChatHistoryPaginationKey));
    },
    onError: (error) => {
      if (error instanceof ChatSDKError) {
        toast({
          type: 'error',
          description: error.message,
        });
      }
    },
  });

  const searchParams = useSearchParams();
  const query = searchParams.get('query');

  const [hasAppendedQuery, setHasAppendedQuery] = useState(false);

  useEffect(() => {
    if (query && !hasAppendedQuery) {
      append({
        role: 'user',
        content: query,
      });

      setHasAppendedQuery(true);
      window.history.replaceState({}, '', `/chat/${id}`);
    }
  }, [query, append, hasAppendedQuery, id]);

  const { data: votes } = useSWR<Array<Vote>>(
    messages.length >= 2 ? `/api/vote?chatId=${id}` : null,
    fetcher,
  );

  const [attachments, setAttachments] = useState<Array<Attachment>>([]);
  const isArtifactVisible = useArtifactSelector((state) => state.isVisible);

  useAutoResume({
    autoResume,
    initialMessages,
    experimental_resume,
    data,
    setMessages,
  });

  return (
    <>
      <div className="flex flex-col min-w-0 h-screen min-h-screen bg-background relative">
        <ChatHeader
          chatId={id}
          selectedModelId={initialChatModel}
          selectedVisibilityType={initialVisibilityType}
          selectedPromptId={selectedPromptId}
          onPromptChange={setSelectedPromptId}
          isReadonly={isReadonly}
          session={session}
        />

        <Messages
          chatId={id}
          status={status}
          votes={votes}
          messages={messages}
          setMessages={setMessages}
          reload={reload}
          isReadonly={isReadonly}
          isArtifactVisible={isArtifactVisible}
        />

        <div className="flex-shrink-0 mx-auto px-2 sm:px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl safe-area-pb">
          {!isReadonly && (
            <MultimodalInput
              chatId={id}
              input={input}
              setInput={setInput}
              handleSubmit={handleSubmit}
              status={status}
              stop={stop}
              attachments={attachments}
              setAttachments={setAttachments}
              messages={messages}
              setMessages={setMessages}
              append={append}
              selectedVisibilityType={visibilityType}
              selectedPromptId={selectedPromptId}
            />
          )}
        </div>
      </div>

      <Artifact
        chatId={id}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
        status={status}
        stop={stop}
        attachments={attachments}
        setAttachments={setAttachments}
        append={append}
        messages={messages}
        setMessages={setMessages}
        reload={reload}
        votes={votes}
        isReadonly={isReadonly}
        selectedVisibilityType={visibilityType}
        selectedPromptId={selectedPromptId}
      />
    </>
  );
}
