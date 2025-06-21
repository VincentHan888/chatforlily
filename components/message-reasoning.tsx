'use client';

import { useState } from 'react';
import { ChevronDownIcon, LoaderIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // 调试信息
  console.log('MessageReasoning 渲染:', {
    isLoading,
    reasoning: reasoning ? `${reasoning.substring(0, 100)}...` : '无内容',
  });

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  // 如果没有reasoning内容且不在加载中，不渲染组件
  if (!isLoading && (!reasoning || reasoning.trim() === '')) {
    console.log('MessageReasoning: 没有思考内容，跳过渲染');
    return null;
  }

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-blue-600 dark:text-blue-400">
            🧠 正在思考...
          </div>
          <div className="animate-spin">
            <LoaderIcon />
          </div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium text-blue-600 dark:text-blue-400">
            🧠 思考了 {Math.ceil((reasoning?.length || 0) / 100)} 秒
          </div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? '隐藏思考过程' : '显示思考过程'}
          >
            <ChevronDownIcon />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && reasoning && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l-2 border-blue-200 dark:border-blue-800 flex flex-col gap-4 bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded-r-lg"
          >
            <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              思考过程：
            </div>
            <Markdown>{reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
