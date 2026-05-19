import type { AIAdapter, AIMessage, AIConfig, AIStreamChunk, ToolDefinition } from './types'

export class OpenAIAdapter implements AIAdapter {
  async chat(messages: AIMessage[], config: AIConfig, tools?: ToolDefinition[]): Promise<AIMessage> {
    const url = `${config.baseURL || this.getDefaultBaseURL(config.provider)}/chat/completions`

    const body: any = {
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls && { tool_calls: m.tool_calls }),
        ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
        ...(m.name && { name: m.name }),
      })),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2000,
    }

    if (tools && tools.length > 0) {
      body.tools = tools
      body.tool_choice = 'auto'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI 请求失败: ${response.status} ${error}`)
    }

    const data = await response.json()
    const choice = data.choices[0]

    return {
      role: 'assistant',
      content: choice.message.content || '',
      tool_calls: choice.message.tool_calls,
    }
  }

  async *chatStream(messages: AIMessage[], config: AIConfig, tools?: ToolDefinition[]): AsyncGenerator<AIStreamChunk> {
    const url = `${config.baseURL || this.getDefaultBaseURL(config.provider)}/chat/completions`

    const body: any = {
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_calls && { tool_calls: m.tool_calls }),
        ...(m.tool_call_id && { tool_call_id: m.tool_call_id }),
        ...(m.name && { name: m.name }),
      })),
      temperature: config.temperature ?? 0.7,
      max_tokens: config.maxTokens ?? 2000,
      stream: true,
    }

    if (tools && tools.length > 0) {
      body.tools = tools
      body.tool_choice = 'auto'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`AI 请求失败: ${response.status} ${error}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取响应流')

    const decoder = new TextDecoder()
    let buffer = ''
    const accumulatedToolCalls: any[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim() || line.trim() === 'data: [DONE]') continue
        if (!line.startsWith('data: ')) continue

        try {
          const json = JSON.parse(line.slice(6))
          const delta = json.choices[0]?.delta

          if (!delta) continue

          // 提取思考链内容（DeepSeek-R1 等模型用 reasoning_content）
          const thinkingContent = delta.reasoning_content || delta.reasoning

          // 累积 tool_calls 的分片
          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0
              if (!accumulatedToolCalls[idx]) {
                accumulatedToolCalls[idx] = {
                  id: tc.id || '',
                  type: 'function',
                  function: { name: '', arguments: '' },
                }
              }
              if (tc.id) accumulatedToolCalls[idx].id = tc.id
              if (tc.function?.name) accumulatedToolCalls[idx].function.name += tc.function.name
              if (tc.function?.arguments) accumulatedToolCalls[idx].function.arguments += tc.function.arguments
            }
          }

          yield {
            content: delta.content || undefined,
            thinking: thinkingContent || undefined,
            tool_calls: undefined, // 不在每个 chunk 中输出 tool_calls，最后统一输出
            done: false,
          }
        } catch (e) {
          console.warn('[OpenAIAdapter] Failed to parse SSE line:', line, e)
        }
      }
    }

    // 流结束后，统一输出累积的 tool_calls
    if (accumulatedToolCalls.length > 0) {
      yield {
        tool_calls: accumulatedToolCalls,
        done: false,
      }
    }

    yield { done: true }
  }

  private getDefaultBaseURL(provider: AIConfig['provider']): string {
    const urls: Record<AIConfig['provider'], string> = {
      openai: 'https://api.openai.com/v1',
      claude: 'https://api.anthropic.com/v1',
      ollama: 'http://localhost:11434/v1',
      zhipu: 'https://open.bigmodel.cn/api/paas/v4',
      deepseek: 'https://api.deepseek.com/v1',
    }
    return urls[provider]
  }
}
