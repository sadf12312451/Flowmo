<template>
  <div class="settings-page">
    <h2 class="page-title">{{ t('nav.settings') }}</h2>

    <div class="settings-section">
      <div class="section-title">外观</div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">深色模式</div>
          <div class="setting-desc">切换浅色 / 深色主题</div>
        </div>
        <n-switch :value="settingsStore.isDark" @update:value="settingsStore.toggleDark" />
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">语言</div>
          <div class="setting-desc">界面显示语言</div>
        </div>
        <n-radio-group :value="settingsStore.locale" @update:value="settingsStore.setLocale">
          <n-radio value="zh-CN">中文</n-radio>
          <n-radio value="en-US">English</n-radio>
        </n-radio-group>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-title">AI 助手</div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">服务提供商</div>
          <div class="setting-desc">选择 AI 服务</div>
        </div>
        <n-select
          v-model:value="aiStore.config.provider"
          :options="providerOptions"
          style="width: 160px"
          @update:value="aiStore.saveConfig"
        />
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">API 密钥</div>
          <div class="setting-desc">用于访问 AI 服务</div>
        </div>
        <n-input
          v-model:value="aiStore.config.apiKey"
          type="password"
          placeholder="sk-..."
          style="width: 280px"
          @blur="aiStore.saveConfig"
        />
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">模型</div>
          <div class="setting-desc">{{ aiStore.getModelDisplayName(aiStore.config.model) }}</div>
        </div>
        <n-input
          v-model:value="aiStore.config.model"
          placeholder="gpt-3.5-turbo"
          style="width: 200px"
          @blur="aiStore.saveConfig"
        />
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">自定义地址（可选）</div>
          <div class="setting-desc">留空使用默认地址</div>
        </div>
        <n-input
          v-model:value="aiStore.config.baseURL"
          placeholder="https://api.openai.com/v1"
          style="width: 280px"
          @blur="aiStore.saveConfig"
        />
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">状态</div>
          <div class="setting-desc">{{ aiStore.isConfigured() ? '已配置 ✓' : '未配置' }}</div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-title">关于</div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">浮墨 Flowmo</div>
          <div class="setting-desc">v0.1.0 · 桌面智能便签应用</div>
        </div>
      </div>
      <div class="setting-item">
        <div class="setting-label">
          <div class="setting-name">开源仓库</div>
          <div class="setting-desc">https://github.com/sadf12312451/Flowmo</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NSwitch, NRadioGroup, NRadio, NSelect, NInput } from 'naive-ui'
import { useSettingsStore } from '../../stores/settings'
import { useAIStore } from '../../services/ai'

const { t } = useI18n()
const settingsStore = useSettingsStore()
const aiStore = useAIStore()

const providerOptions = computed(() => [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Claude', value: 'claude' },
  { label: '本地模型 (Ollama)', value: 'ollama' },
  { label: '智谱 AI', value: 'zhipu' },
  { label: 'DeepSeek', value: 'deepseek' },
])
</script>

<style scoped>
.settings-page {
  max-width: 720px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
}

.settings-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.55;
  margin-bottom: 10px;
  padding-left: 4px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: rgba(128, 128, 128, 0.05);
  border-radius: 10px;
  margin-bottom: 8px;
}

.setting-label {
  flex: 1;
}

.setting-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.setting-desc {
  font-size: 12px;
  opacity: 0.55;
}
</style>
