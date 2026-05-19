import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AIConfig } from './types'

export const useAIStore = defineStore('ai', () => {
  // 默认配置
  const config = ref<AIConfig>({
    provider: 'openai',
    apiKey: '',
    baseURL: '',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 2000,
  })

  // 从 localStorage 加载配置
  function loadConfig() {
    const saved = localStorage.getItem('ai_config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        config.value = { ...config.value, ...parsed }
      } catch (e) {
        console.error('[AIStore] Failed to load config:', e)
      }
    }
  }

  // 保存配置到 localStorage
  function saveConfig() {
    localStorage.setItem('ai_config', JSON.stringify(config.value))
  }

  // 更新配置
  function updateConfig(partial: Partial<AIConfig>) {
    config.value = { ...config.value, ...partial }
    saveConfig()
  }

  // 验证配置是否完整
  function isConfigured(): boolean {
    return !!(config.value.apiKey && config.value.model)
  }

  // 获取模型显示名称（普通人看得懂的）
  function getModelDisplayName(model: string): string {
    const names: Record<string, string> = {
      'gpt-3.5-turbo': '快速',
      'gpt-4': '聪明',
      'gpt-4-turbo': '聪明（快速版）',
      'gpt-4o': '聪明（最新）',
      'claude-3-haiku': '快速',
      'claude-3-sonnet': '均衡',
      'claude-3-opus': '聪明',
      'claude-3-5-sonnet': '聪明（最新）',
      'deepseek-chat': '深度思考',
      'glm-4': '智谱',
    }
    return names[model] || model
  }

  // 获取提供商显示名称
  function getProviderDisplayName(provider: AIConfig['provider']): string {
    const names: Record<AIConfig['provider'], string> = {
      openai: 'OpenAI',
      claude: 'Claude',
      ollama: '本地模型',
      zhipu: '智谱 AI',
      deepseek: 'DeepSeek',
    }
    return names[provider]
  }

  // 初始化时加载配置
  loadConfig()

  return {
    config,
    loadConfig,
    saveConfig,
    updateConfig,
    isConfigured,
    getModelDisplayName,
    getProviderDisplayName,
  }
})
