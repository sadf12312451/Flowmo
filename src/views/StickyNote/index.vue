<template>
  <div class="sticky-note-page">
    <div class="page-header">
      <h2>{{ t('nav.stickyNote') }}</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon><n-icon :component="AddOutline" /></template>
        {{ t('common.create') }}
      </n-button>
    </div>

    <n-spin :show="notesStore.loading">
      <div v-if="notesStore.notes.length === 0 && !notesStore.loading" class="empty-state">
        <n-empty description="还没有便签，点击上方按钮新建一个吧">
          <template #icon><n-icon :component="DocumentTextOutline" /></template>
        </n-empty>
      </div>

      <div v-else class="notes-grid">
        <div
          v-for="note in notesStore.notes"
          :key="note.id"
          class="note-card"
          :style="{ backgroundColor: note.color, opacity: note.opacity }"
          @dblclick="openStickyFloat(note.id, { width: note.width, height: note.height })"
        >
          <div class="note-card-header">
            <n-button quaternary circle size="tiny" @click="notesStore.togglePin(note.id)">
              <template #icon>
                <n-icon :component="note.pinned ? Pin : PinOutline" />
              </template>
            </n-button>
            <div class="note-card-actions">
              <n-button quaternary circle size="tiny" @click="handleEdit(note)">
                <template #icon><n-icon :component="CreateOutline" /></template>
              </n-button>
              <n-dropdown :options="moreOptions" @select="(key: string) => handleMore(key, note)">
                <n-button quaternary circle size="tiny">
                  <template #icon><n-icon :component="EllipsisVerticalOutline" /></template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
          <div class="note-card-title">{{ note.title || '无标题' }}</div>
          <div class="note-card-content">{{ note.content || '空便签' }}</div>
          <div class="note-card-time">{{ formatTime(note.updated_at) }}</div>
        </div>
      </div>
    </n-spin>

    <!-- 编辑弹窗 -->
    <n-modal v-model:show="showEditor" preset="card" :title="editingNote ? '编辑便签' : '新建便签'" style="width: 500px;">
      <n-form>
        <n-form-item label="标题">
          <n-input v-model:value="form.title" placeholder="便签标题（可选）" />
        </n-form-item>
        <n-form-item label="内容">
          <n-input v-model:value="form.content" type="textarea" placeholder="写点什么..." :rows="6" />
        </n-form-item>
        <n-form-item label="颜色">
          <div class="color-picker">
            <div
              v-for="c in colorOptions"
              :key="c"
              class="color-dot"
              :class="{ active: form.color === c }"
              :style="{ backgroundColor: c }"
              @click="form.color = c"
            />
          </div>
        </n-form-item>
        <n-form-item label="透明度">
          <n-slider v-model:value="form.opacity" :min="0.3" :max="1" :step="0.05" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditor = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleSave">{{ t('common.save') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton, NIcon, NModal, NForm, NFormItem, NInput, NSlider,
  NSpace, NSpin, NEmpty, NDropdown, useMessage, useDialog,
} from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import {
  AddOutline, DocumentTextOutline, CreateOutline,
  EllipsisVerticalOutline, PinOutline, Pin,
  TrashOutline, CopyOutline, ColorPaletteOutline, OpenOutline,
} from '@vicons/ionicons5'
import { useNotesStore, type StickyNote } from '../../stores/notes'
import { openStickyFloat } from '../../services/stickyWindow'

const { t } = useI18n()
const notesStore = useNotesStore()
const message = useMessage()
const dialog = useDialog()

const showEditor = ref(false)
const editingNote = ref<StickyNote | null>(null)
const form = ref({
  title: '',
  content: '',
  color: '#fffae6',
  opacity: 1,
})

const colorOptions = [
  '#fffae6', '#fff3e0', '#fce4ec', '#f3e5f5',
  '#e8eaf6', '#e0f7fa', '#e8f5e9', '#f5f5f5',
]

const moreOptions: DropdownOption[] = [
  { label: '弹出浮窗', key: 'float', icon: () => h(NIcon, null, { default: () => h(OpenOutline) }) },
  { label: '编辑', key: 'edit', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) },
  { label: '复制', key: 'copy', icon: () => h(NIcon, null, { default: () => h(CopyOutline) }) },
  { label: '颜色', key: 'color', icon: () => h(NIcon, null, { default: () => h(ColorPaletteOutline) }) },
  { type: 'divider', key: 'd1' },
  { label: '删除', key: 'delete', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) },
]

function formatTime(time: string) {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function handleCreate() {
  editingNote.value = null
  form.value = { title: '', content: '', color: '#fffae6', opacity: 1 }
  showEditor.value = true
}

function handleEdit(note: StickyNote) {
  editingNote.value = note
  form.value = {
    title: note.title,
    content: note.content,
    color: note.color,
    opacity: note.opacity,
  }
  showEditor.value = true
}

async function handleSave() {
  if (editingNote.value) {
    await notesStore.updateNote(editingNote.value.id, form.value)
    message.success('便签已更新')
  } else {
    await notesStore.createNote(form.value)
    message.success('便签已创建')
  }
  showEditor.value = false
}

function handleMore(key: string, note: StickyNote) {
  switch (key) {
    case 'float':
      openStickyFloat(note.id, { width: note.width, height: note.height, color: note.color })
      break
    case 'edit':
      handleEdit(note)
      break
    case 'copy':
      notesStore.createNote({ title: note.title, content: note.content, color: note.color })
      message.success('便签已复制')
      break
    case 'color':
      handleEdit(note)
      break
    case 'delete':
      dialog.warning({
        title: '确认删除',
        content: '便签将移入回收站，可以稍后恢复。',
        positiveText: '删除',
        negativeText: '取消',
        onPositiveClick: async () => {
          await notesStore.deleteNote(note.id)
          message.success('便签已移入回收站')
        },
      })
      break
  }
}

onMounted(() => {
  notesStore.loadNotes()
})
</script>

<style scoped>
.sticky-note-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.note-card {
  border-radius: 12px;
  padding: 14px;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.note-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.note-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.note-card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.note-card:hover .note-card-actions {
  opacity: 1;
}

.note-card-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
  color: rgba(0, 0, 0, 0.85);
}

.note-card-content {
  flex: 1;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.6);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.note-card-time {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
  margin-top: 10px;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.15s, transform 0.15s;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  border-color: #333;
}
</style>
