// AI 服务统一接口类型定义

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  thinking?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string // JSON string
  }
}

export interface AIConfig {
  provider: 'openai' | 'claude' | 'ollama' | 'zhipu' | 'deepseek'
  apiKey?: string
  baseURL?: string
  model: string
  temperature?: number
  maxTokens?: number
}

export interface AIStreamChunk {
  content?: string
  thinking?: string
  tool_calls?: ToolCall[]
  done: boolean
}

export interface AIAdapter {
  chat(messages: AIMessage[], config: AIConfig): Promise<AIMessage>
  chatStream(messages: AIMessage[], config: AIConfig): AsyncGenerator<AIStreamChunk>
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, {
        type: string
        description: string
        enum?: string[]
      }>
      required: string[]
    }
  }
}

export interface ToolExecutionResult {
  success: boolean
  data?: any
  error?: string
}
