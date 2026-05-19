import { OpenAIAdapter } from './openai-adapter'
import { useAIStore } from './store'
import { TOOLS, executeTool } from './tools'
import { collectUserContext, getSystemPrompt } from './context'
import type { AIMessage, AIStreamChunk, ToolDefinition } from './types'

export * from './types'
export * from './store'
export * from './tools'
export * from './context'

// 单例适配器
const adapter = new OpenAIAdapter()

/**
 * 发送消息给 AI（非流式）
 */
export async function sendMessage(
  messages: AIMessage[],
  enableTools = true
): Promise<AIMessage> {
  const aiStore = useAIStore()

  if (!aiStore.isConfigured()) {
    throw new Error('请先配置 AI 服务')
  }

  return adapter.chat(messages, aiStore.config, enableTools ? TOOLS : undefined)
}

/**
 * 发送消息给 AI（流式）
 */
export async function* sendMessageStream(
  messages: AIMessage[],
  enableTools = true
): AsyncGenerator<AIStreamChunk> {
  const aiStore = useAIStore()

  if (!aiStore.isConfigured()) {
    throw new Error('请先配置 AI 服务')
  }

  yield* adapter.chatStream(messages, aiStore.config, enableTools ? TOOLS : undefined)
}

/**
 * 执行工具调用并返回结果消息
 */
export async function executeToolCalls(toolCalls: any[]): Promise<AIMessage[]> {
  const results: AIMessage[] = []

  for (const call of toolCalls) {
    const { id, function: func } = call
    const args = JSON.parse(func.arguments)

    const result = await executeTool(func.name, args)

    results.push({
      role: 'tool',
      content: JSON.stringify(result),
      tool_call_id: id,
      name: func.name,
    })
  }

  return results
}

/**
 * 格式化错误信息（给普通人看的）
 */
export function formatAIError(error: any): string {
  const message = error?.message || String(error)

  // 网络错误
  if (message.includes('fetch') || message.includes('network')) {
    return '网络连接失败，请检查网络'
  }

  // 认证错误
  if (message.includes('401') || message.includes('Unauthorized')) {
    return 'API 密钥无效，请检查设置'
  }

  // 配额错误
  if (message.includes('quota') || message.includes('limit')) {
    return 'API 使用额度不足'
  }

  // 模型不存在
  if (message.includes('model') && message.includes('not found')) {
    return '模型不可用，请更换模型'
  }

  // 其他错误
  return '请求失败，请稍后重试'
}
