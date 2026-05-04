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
import { useI18n } from 'vue-i18n'
import { NSwitch, NRadioGroup, NRadio } from 'naive-ui'
import { useSettingsStore } from '../../stores/settings'

const { t } = useI18n()
const settingsStore = useSettingsStore()
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
