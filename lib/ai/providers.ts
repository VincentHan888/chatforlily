import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
  type LanguageModelV1,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.mock';
import { chatModels } from './models';

// 统一的API密钥
const API_KEY = 'sk-VSW0dzxkoGdMp6Wp0qITtBxTcSSh1cxKRGy65KG7QFk948pe';

// 中转接口配置
const PROXY_CONFIG = {
  openai: {
    baseURL: 'https://api.openai-proxy.org/v1',
    apiKey: API_KEY,
  },
  anthropic: {
    baseURL: 'https://api.openai-proxy.org/anthropic',
    apiKey: API_KEY,
  },
};

// 创建OpenAI客户端
const openaiClient = createOpenAI({
  baseURL: PROXY_CONFIG.openai.baseURL,
  apiKey: PROXY_CONFIG.openai.apiKey,
});

// 创建Anthropic客户端
const anthropicClient = createAnthropic({
  baseURL: PROXY_CONFIG.anthropic.baseURL,
  apiKey: PROXY_CONFIG.anthropic.apiKey,
});

// 获取模型对应的reasoning标签配置
function getReasoningConfig(modelId: string) {
  // 不同模型使用不同的thinking标签
  const reasoningConfigs: Record<
    string,
    { tagName: string; startWithReasoning?: boolean }
  > = {
    o3: { tagName: 'think', startWithReasoning: true },
    'deepseek-reasoner': { tagName: 'think', startWithReasoning: true },
    'deepseek-chat': { tagName: 'think', startWithReasoning: true },
    'claude-sonnet-4-0': { tagName: 'reasoning' },
  };

  return (
    reasoningConfigs[modelId] || { tagName: 'think', startWithReasoning: true }
  );
}

// 根据模型ID获取对应的语言模型
function getLanguageModel(modelId: string): LanguageModelV1 {
  const model = chatModels.find((m) => m.id === modelId);

  if (!model) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  let baseModel: LanguageModelV1;

  if (model.provider === 'anthropic') {
    // Claude 模型
    baseModel = anthropicClient(modelId);
  } else {
    // OpenAI 兼容模型 (GPT, DeepSeek等)
    baseModel = openaiClient(modelId);
  }

  // 如果模型支持推理，包装推理中间件
  if (model.hasReasoning) {
    const reasoningConfig = getReasoningConfig(modelId);
    console.log(
      `配置thinking模型 ${modelId}，使用标签: ${reasoningConfig.tagName}，startWithReasoning: ${reasoningConfig.startWithReasoning}`,
    );

    return wrapLanguageModel({
      model: baseModel,
      middleware: extractReasoningMiddleware({
        tagName: reasoningConfig.tagName,
        separator: '\n\n', // 使用双换行分隔推理和正文内容
        // 确保推理内容和正文内容都能正确提取
        ...(reasoningConfig.startWithReasoning && {
          startWithReasoning: true,
        }),
      }),
    });
  }

  return baseModel;
}

// 创建语言模型映射
const createLanguageModels = () => {
  const models: Record<string, LanguageModelV1> = {};

  // 为每个模型创建对应的语言模型
  chatModels.forEach((model) => {
    models[model.id] = getLanguageModel(model.id);
  });

  // 保持兼容性的别名
  models['chat-model'] = models['claude-sonnet-4-0']; // 默认聊天模型
  models['chat-model-reasoning'] = models['deepseek-reasoner']; // 默认推理模型
  models['title-model'] = models['gpt-4.1']; // 标题生成模型
  models['artifact-model'] = models['claude-sonnet-4-0']; // 工件生成模型

  return models;
};

// 创建图像模型 (使用OpenAI的DALL-E)
const createImageModels = () => {
  return {
    'small-model': openaiClient.image('dall-e-3'),
  };
};

export const myProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: createLanguageModels(),
      imageModels: createImageModels(),
    });

// 导出辅助函数
export function isReasoningModel(modelId: string): boolean {
  const model = chatModels.find((m) => m.id === modelId);
  return model?.hasReasoning === true;
}

export function getModelProvider(
  modelId: string,
): 'openai' | 'anthropic' | undefined {
  const model = chatModels.find((m) => m.id === modelId);
  return model?.provider;
}
