<template>
  <n-config-provider :theme="settingsStore.isDark ? darkTheme : undefined" :locale="naiveLocale" :date-locale="naiveDateLocale">
    <n-global-style />
    <!-- 浮窗路由：无布局 -->
    <template v-if="isFloatWindow">
      <router-view />
    </template>
    <!-- 主窗口：完整布局 -->
    <template v-else>
      <n-notification-provider>
        <n-dialog-provider>
        <n-message-provider>
          <div class="app-layout">
            <Titlebar :title="t('app.name')" />
            <div class="app-body">
              <Sidebar />
              <main class="app-content">
                <router-view />
              </main>
            </div>
          </div>
        </n-message-provider>
        </n-dialog-provider>
      </n-notification-provider>
    </template>
  </n-config-provider>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  NConfigProvider,
  NGlobalStyle,
  NNotificationProvider,
  NDialogProvider,
  NMessageProvider,
  darkTheme,
  zhCN,
  enUS,
  dateZhCN,
  dateEnUS,
} from 'naive-ui'
import Sidebar from './components/layout/Sidebar.vue'
import Titlebar from './components/layout/Titlebar.vue'
import { useSettingsStore } from './stores/settings'

const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const isFloatWindow = computed(() => route.path.startsWith('/sticky-float'))
const naiveLocale = computed(() => (settingsStore.locale === 'zh-CN' ? zhCN : enUS))
const naiveDateLocale = computed(() => (settingsStore.locale === 'zh-CN' ? dateZhCN : dateEnUS))

onMounted(() => {
  settingsStore.init()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.page-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
