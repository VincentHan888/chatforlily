'use client';

import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useRef } from 'react';
import { artifactDefinitions } from './artifact';
import type { ArtifactKind } from './artifact';
import type { Suggestion } from '@/lib/db/schema';
import { initialArtifactData, useArtifact } from '@/hooks/use-artifact';

export type DataStreamDelta = {
  type:
    | 'text-delta'
    | 'code-delta'
    | 'sheet-delta'
    | 'image-delta'
    | 'title'
    | 'id'
    | 'suggestion'
    | 'clear'
    | 'finish'
    | 'kind';
  content: string | Suggestion;
};

export function DataStreamHandler({ id }: { id: string }) {
  const { data: dataStream } = useChat({ id });
  const { artifact, setArtifact, setMetadata } = useArtifact();
  const lastProcessedIndex = useRef(-1);

  const artifactRef = useRef(artifact);
  // 同步最新的 artifact 到 ref，避免异步回调中读取到旧值
  useEffect(() => {
    artifactRef.current = artifact;
  }, [artifact]);

  // 统一处理单个 delta 的逻辑
  const processDelta = useCallback(
    (delta: DataStreamDelta) => {
      const currentArtifact = artifactRef.current;

      const artifactDefinition = artifactDefinitions.find(
        (def) => def.kind === currentArtifact.kind,
      );

      if (artifactDefinition?.onStreamPart) {
        artifactDefinition.onStreamPart({
          streamPart: delta,
          setArtifact,
          setMetadata,
        });
      }

      // 仅处理与 artifact 元数据相关的特殊指令
      if (
        delta.type === 'id' ||
        delta.type === 'title' ||
        delta.type === 'kind' ||
        delta.type === 'clear' ||
        delta.type === 'finish'
      ) {
        setArtifact((draftArtifact) => {
          if (!draftArtifact) {
            return { ...initialArtifactData, status: 'streaming' };
          }

          switch (delta.type) {
            case 'id':
              return {
                ...draftArtifact,
                documentId: delta.content as string,
                status: 'streaming',
              };
            case 'title':
              return {
                ...draftArtifact,
                title: delta.content as string,
                status: 'streaming',
              };
            case 'kind':
              return {
                ...draftArtifact,
                kind: delta.content as ArtifactKind,
                status: 'streaming',
              };
            case 'clear':
              return {
                ...draftArtifact,
                content: '',
                status: 'streaming',
              };
            case 'finish':
              return {
                ...draftArtifact,
                status: 'idle',
              };
            default:
              return draftArtifact;
          }
        });
      }
    },
    [setArtifact, setMetadata],
  );

  useEffect(() => {
    if (!dataStream?.length) return;

    const newDeltas = dataStream.slice(lastProcessedIndex.current + 1);
    lastProcessedIndex.current = dataStream.length - 1;

    (newDeltas as DataStreamDelta[]).forEach(processDelta);
  }, [dataStream, processDelta]);

  return null;
}
