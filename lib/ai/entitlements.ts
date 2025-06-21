import type { UserType } from '@/app/(auth)/auth';
import type { ChatModel } from './models';

interface Entitlements {
  maxMessagesPerDay: number;
  availableChatModelIds: Array<ChatModel['id']>;
}

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerDay: 50,
    availableChatModelIds: [
      'claude-sonnet-4-0',
      'gpt-4.1',
      'o3',
      'deepseek-chat',
      'deepseek-reasoner',
      // 保持向后兼容
      'chat-model',
      'chat-model-reasoning',
    ],
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerDay: 100,
    availableChatModelIds: [
      'claude-sonnet-4-0',
      'gpt-4.1',
      'o3',
      'deepseek-chat',
      'deepseek-reasoner',
      // 保持向后兼容
      'chat-model',
      'chat-model-reasoning',
    ],
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
