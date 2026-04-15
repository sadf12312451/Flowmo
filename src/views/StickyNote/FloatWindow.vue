<template>
  <div
    class="sticky-float"
    :style="{ backgroundColor: bgColor }"
  >
    <div class="float-header" data-tauri-drag-region>
      <div class="float-actions">
        <n-button quaternary circle size="tiny" @click="togglePin" :title="note.pinned ? '取消置顶' : '置顶'">
          <template #icon><n-icon :component="note.pinned ? Pin : PinOutline" :size="14" /></template>
        </n-button>
        <n-button quaternary circle size="tiny" @click="showSettings = !showSettings" title="设置">
          <template #icon><n-icon :component="SettingsOutline" :size="14" /></template>
        </n-button>
      </div>
      <div class="float-actions">
        <n-button quaternary circle size="tiny" @click="closeWindow" title="最小化">
          <template #icon><n-icon :component="RemoveOutline" :size="14" /></template>
        </n-button>
        <n-button quaternary circle size="tiny" @click="confirmDelete" title="删除">
          <template #icon><n-icon :component="TrashOutline" :size="14" /></template>
        </n-button>
      </div>
    </div>

    <!-- 设置面板 -->
    <div v-if="showSettings" class="settings-panel">
      <div class="setting-row">
        <span class="setting-label">颜色</span>
        <div class="color-dots">
          <span
            v-for="c in colors"
            :key="c"
            class="dot"
            :class="{ active: note.color === c }"
            :style="{ backgroundColor: c }"
            @click="changeColor(c)"
          />
        </div>
      </div>
      <div class="setting-row">
        <span class="setting-label">透明</span>
        <input type="range" :value="blurOpacity" min="1" max="100" step="5" class="opacity-slider" @input="changeOpacity" />
        <span class="setting-value">{{ blurOpacity }}%</span>
      </div>
    </div>

    <input
      v-model="note.title"
      class="float-title"
      placeholder="标题"
      @input="scheduleSave"
    />

    <textarea
      v-model="note.content"
      class="float-content"
      placeholder="写点什么..."
      @input="scheduleSave"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, onUnmounted } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { Pin, PinOutline, RemoveOutline, TrashOutline, SettingsOutline } from '@vicons/ionicons5'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { getDb, query, execute } from '../../services/db'

const appWindow = getCurrentWindow()

const colors = [
  '#fffae6', '#fff3e0', '#fce4ec', '#f3e5f5',
  '#e8eaf6', '#e0f7fa', '#e8f5e9', '#ffffff',
]

const note = reactive({
  id: 0,
  title: '',
  content: '',
  color: '#fffae6',
  pinned: 0,
  opacity: 0.85,
})

const showSettings = ref(false)
const blurOpacity = ref(50)

// 将 hex 颜色转换为带透明度的 rgba
const bgColor = computed(() => {
  const hex = note.color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  // 聚焦时 acrylic 生效，背景色只是叠加层；失焦时背景色成为主体
  const alpha = Math.max(0.01, blurOpacity.value / 100)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
})

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(saveNote, 500)
}

async function saveNote() {
  if (!note.id) return
  await execute(
    "UPDATE sticky_notes SET title = $1, content = $2, color = $3, pinned = $4, opacity = $5, updated_at = datetime('now', 'localtime') WHERE id = $6",
    [note.title, note.content, note.color, note.pinned, blurOpacity.value / 100, note.id]
  )
}

async function changeColor(c: string) {
  note.color = c
  await saveNote()
}

function changeOpacity(e: Event) {
  blurOpacity.value = parseInt((e.target as HTMLInputElement).value)
  scheduleSave()
}

async function togglePin() {
  note.pinned = note.pinned ? 0 : 1
  await appWindow.setAlwaysOnTop(!!note.pinned)
  await saveNote()
}

async function closeWindow() {
  await saveNote()
  await appWindow.hide()
}

async function confirmDelete() {
  await execute(
    "UPDATE sticky_notes SET deleted = 1, deleted_at = datetime('now', 'localtime') WHERE id = $1",
    [note.id]
  )
  await appWindow.close()
}

onMounted(async () => {
  await getDb()

  // 应用原生毛玻璃（聚焦时生效，失焦降级为半透明）
  try {
    await invoke('apply_blur_effect', { label: appWindow.label })
  } catch (e) {
    console.warn('acrylic not supported:', e)
  }

  const label = appWindow.label
  const id = parseInt(label.replace('sticky-', ''), 10)
  if (!id) return

  const rows = await query<Record<string, unknown>>('SELECT * FROM sticky_notes WHERE id = $1', [id])
  if (rows.length > 0) {
    const row = rows[0]
    note.id = row.id as number
    note.title = row.title as string
    note.content = row.content as string
    note.color = row.color as string
    note.pinned = row.pinned as number
    note.opacity = row.opacity as number
    blurOpacity.value = Math.round(((note.opacity as unknown as number) || 0.5) * 100)
  }

  if (note.pinned) {
    await appWindow.setAlwaysOnTop(true)
  }
})

onUnmounted(() => {
  if (saveTimer) clearTimeout(saveTimer)
})
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
html, body, #app {
  height: 100%;
  overflow: hidden;
}
</style>

<style scoped>
.sticky-float {
  display: flex;
  flex-direction: column;
  height: 100vh;
  border-radius: 10px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: box-shadow 0.2s;
}

.float-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  cursor: grab;
  min-height: 28px;
}

.float-actions {
  display: flex;
  gap: 2px;
}

.settings-panel {
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  width: 28px;
  flex-shrink: 0;
}

.setting-value {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  width: 32px;
  text-align: right;
}

.color-dots {
  display: flex;
  gap: 4px;
  flex: 1;
}

.dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  cursor: pointer;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.15s;
}

.dot:hover { transform: scale(1.2); }
.dot.active { border-color: rgba(0, 0, 0, 0.5); }

.opacity-slider {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.opacity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.4);
  cursor: pointer;
}

.float-title {
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 12px;
  outline: none;
  color: rgba(0, 0, 0, 0.85);
}

.float-content {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 13px;
  padding: 4px 12px;
  outline: none;
  resize: none;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.7);
}
</style>
