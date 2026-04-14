<template>
  <div class="titlebar" data-tauri-drag-region>
    <div class="titlebar-title" data-tauri-drag-region>{{ title }}</div>
    <div class="titlebar-buttons">
      <button class="titlebar-btn" @click="minimize">
        <n-icon :component="RemoveOutline" :size="16" />
      </button>
      <button class="titlebar-btn" @click="toggleMaximize">
        <n-icon :component="isMaximized ? ContractOutline : ExpandOutline" :size="16" />
      </button>
      <button class="titlebar-btn close" @click="close">
        <n-icon :component="CloseOutline" :size="16" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NIcon } from 'naive-ui'
import { RemoveOutline, ExpandOutline, ContractOutline, CloseOutline } from '@vicons/ionicons5'
import { getCurrentWindow } from '@tauri-apps/api/window'

defineProps<{ title: string }>()

const isMaximized = ref(false)
const appWindow = getCurrentWindow()

async function minimize() {
  await appWindow.minimize()
}

async function toggleMaximize() {
  const maximized = await appWindow.isMaximized()
  if (maximized) {
    await appWindow.unmaximize()
  } else {
    await appWindow.maximize()
  }
  isMaximized.value = !maximized
}

async function close() {
  await appWindow.hide()
}
</script>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 8px;
  user-select: none;
  -webkit-user-select: none;
}

.titlebar-title {
  font-size: 12px;
  opacity: 0.6;
  flex: 1;
  padding-left: 8px;
}

.titlebar-buttons {
  display: flex;
  gap: 2px;
}

.titlebar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: inherit;
  transition: background 0.15s;
}

.titlebar-btn:hover {
  background: rgba(128, 128, 128, 0.15);
}

.titlebar-btn.close:hover {
  background: #e81123;
  color: white;
}
</style>
