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

    <div v-if="!settingsStore.sidebarCollapsed" class="sidebar-search" @click="searchStore.showSearchPanel = true">
      <n-icon :component="SearchOutline" :size="14" />
      <span class="search-text">搜索...</span>
      <kbd class="search-kbd">Ctrl+K</kbd>
    </div>
    <div v-else class="sidebar-search-icon" @click="searchStore.showSearchPanel = true">
      <n-button quaternary circle size="small">
        <template #icon><n-icon :component="SearchOutline" /></template>
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
  SearchOutline,
} from '@vicons/ionicons5'
import { useSettingsStore } from '../../stores/settings'
import { useSearchStore } from '../../stores/search'

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const settingsStore = useSettingsStore()
const searchStore = useSearchStore()

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

.sidebar-search {
  margin: 0 12px 8px;
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  background: rgba(128, 128, 128, 0.08);
  cursor: pointer;
  font-size: 12px;
  color: rgba(128, 128, 128, 1);
  transition: background 0.15s;
}

.sidebar-search:hover {
  background: rgba(128, 128, 128, 0.15);
}

.search-text {
  flex: 1;
  opacity: 0.7;
}

.search-kbd {
  font-size: 10px;
  font-family: monospace;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(128, 128, 128, 0.15);
  opacity: 0.7;
}

.sidebar-search-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}
</style>
