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

    <div class="custom-menu">
      <div
        v-for="item in menuItems"
        :key="item.key"
        class="menu-item"
        :class="{ active: currentRoute === item.key, divider: item.divider }"
        @click="!item.divider && handleMenuUpdate(item.key)"
      >
        <template v-if="!item.divider">
          <n-icon :component="item.icon" :size="settingsStore.sidebarCollapsed ? 22 : 18" />
          <span v-if="!settingsStore.sidebarCollapsed" class="menu-label">{{ item.label }}</span>
        </template>
      </div>
    </div>

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
import { computed, type Component } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
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

interface MenuItem {
  key: string
  label?: string
  icon?: Component
  divider?: boolean
}

const menuItems = computed<MenuItem[]>(() => [
  { key: 'StickyNote', label: t('nav.stickyNote'), icon: DocumentTextOutline },
  { key: 'Notepad', label: t('nav.notepad'), icon: BookOutline },
  { key: 'Todo', label: t('nav.todo'), icon: CheckboxOutline },
  { key: 'Countdown', label: t('nav.countdown'), icon: TimerOutline },
  { key: 'Pomodoro', label: t('nav.pomodoro'), icon: HourglassOutline },
  { key: 'Calendar', label: t('nav.calendar'), icon: CalendarOutline },
  { key: 'HabitTracker', label: t('nav.habitTracker'), icon: FitnessOutline },
  { key: 'div-1', divider: true },
  { key: 'Stats', label: t('nav.stats'), icon: StatsChartOutline },
  { key: 'Trash', label: t('nav.trash'), icon: TrashOutline },
  { key: 'Settings', label: t('nav.settings'), icon: SettingsOutline },
])

function handleMenuUpdate(key: string) {
  console.log('[Sidebar] menu clicked:', key)
  router.push({ name: key }).then(() => {
    console.log('[Sidebar] navigated to', key)
  }).catch(err => {
    console.error('[Sidebar] Failed to navigate to', key, err)
  })
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

.custom-menu {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  margin-bottom: 2px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: rgba(120, 120, 120, 1);
  transition: background 0.12s, color 0.12s;
  user-select: none;
}

.menu-item:hover {
  background: rgba(128, 128, 128, 0.1);
}

.menu-item.active {
  background: rgba(64, 152, 252, 0.1);
  color: #4098fc;
  font-weight: 500;
}

.menu-item.divider {
  height: 1px;
  background: rgba(128, 128, 128, 0.15);
  margin: 8px 12px;
  padding: 0;
  cursor: default;
}

.menu-item.divider:hover {
  background: rgba(128, 128, 128, 0.15);
}

.menu-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar.collapsed .menu-item {
  justify-content: center;
  padding: 9px 0;
}
</style>
