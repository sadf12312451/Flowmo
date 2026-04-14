<template>
  <div class="sidebar" :class="{ collapsed: settingsStore.sidebarCollapsed }">
    <div class="sidebar-header">
      <span v-if="!settingsStore.sidebarCollapsed" class="app-title">{{ t('app.name') }}</span>
      <n-button quaternary circle size="small" @click="settingsStore.toggleSidebar">
        <template #icon>
          <n-icon :component="settingsStore.sidebarCollapsed ? MenuOutline : CloseOutline" />
        </template>
      </n-button>
    </div>

    <n-menu
      :value="currentRoute"
      :collapsed="settingsStore.sidebarCollapsed"
      :collapsed-width="64"
      :collapsed-icon-size="22"
      :options="menuOptions"
      @update:value="handleMenuUpdate"
    />

    <div class="sidebar-footer">
      <n-button quaternary circle size="small" @click="settingsStore.toggleDark">
        <template #icon>
          <n-icon :component="settingsStore.isDark ? SunnyOutline : MoonOutline" />
        </template>
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NMenu, NButton, NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  DocumentTextOutline,
  BookOutline,
  CheckboxOutline,
  TimerOutline,
  HourglassOutline,
  CalendarOutline,
  FitnessOutline,
  StatsChartOutline,
  TrashOutline,
  SettingsOutline,
  MenuOutline,
  CloseOutline,
  SunnyOutline,
  MoonOutline,
} from '@vicons/ionicons5'
import { useSettingsStore } from '../../stores/settings'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()

const currentRoute = computed(() => route.name as string)

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions = computed<MenuOption[]>(() => [
  { label: t('nav.stickyNote'), key: 'StickyNote', icon: renderIcon(DocumentTextOutline) },
  { label: t('nav.notepad'), key: 'Notepad', icon: renderIcon(BookOutline) },
  { label: t('nav.todo'), key: 'Todo', icon: renderIcon(CheckboxOutline) },
  { label: t('nav.countdown'), key: 'Countdown', icon: renderIcon(TimerOutline) },
  { label: t('nav.pomodoro'), key: 'Pomodoro', icon: renderIcon(HourglassOutline) },
  { label: t('nav.calendar'), key: 'Calendar', icon: renderIcon(CalendarOutline) },
  { label: t('nav.habitTracker'), key: 'HabitTracker', icon: renderIcon(FitnessOutline) },
  { type: 'divider' },
  { label: t('nav.stats'), key: 'Stats', icon: renderIcon(StatsChartOutline) },
  { label: t('nav.trash'), key: 'Trash', icon: renderIcon(TrashOutline) },
  { label: t('nav.settings'), key: 'Settings', icon: renderIcon(SettingsOutline) },
])

function handleMenuUpdate(key: string) {
  router.push({ name: key })
}
</script>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 220px;
  height: 100vh;
  border-right: 1px solid var(--n-border-color, #e0e0e0);
  transition: width 0.2s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  min-height: 56px;
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
}

.sidebar-footer {
  margin-top: auto;
  padding: 12px 16px;
  display: flex;
  justify-content: center;
}
</style>
