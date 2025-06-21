export const DEFAULT_CHAT_MODEL: string = 'claude-sonnet-4-0';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'anthropic';
  hasReasoning?: boolean;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'claude-sonnet-4-0',
    name: 'Claude Sonnet 4.0',
    description: 'Claude最新旗舰模型，适合复杂对话和分析',
    provider: 'anthropic',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'OpenAI GPT-4.1 模型',
    provider: 'openai',
  },
  {
    id: 'o3',
    name: 'OpenAI o3',
    description: 'OpenAI o3 推理模型，具备高级思考能力',
    provider: 'openai',
    hasReasoning: true,
  },
  {
    id: 'deepseek-chat',
    name: 'DeepSeek Chat',
    description: 'DeepSeek 对话模型',
    provider: 'openai',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek Reasoner',
    description: 'DeepSeek 推理模型，具备思考能力',
    provider: 'openai',
    hasReasoning: true,
  },
];
