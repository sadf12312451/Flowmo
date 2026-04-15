<template>
  <div class="notepad-page">
    <!-- 笔记列表侧栏 -->
    <div class="note-sidebar">
      <div class="note-sidebar-header">
        <span class="note-sidebar-title">{{ t('nav.notepad') }}</span>
        <n-button quaternary circle size="small" @click="handleCreate">
          <template #icon><n-icon :component="AddOutline" /></template>
        </n-button>
      </div>
      <div class="note-list">
        <div
          v-for="note in notepadStore.notes"
          :key="note.id"
          class="note-list-item"
          :class="{ active: notepadStore.currentNote?.id === note.id }"
          @click="notepadStore.selectNote(note)"
        >
          <div class="note-list-title">{{ note.title || '未命名笔记' }}</div>
          <div class="note-list-time">{{ formatTime(note.updated_at) }}</div>
        </div>
        <div v-if="notepadStore.notes.length === 0" class="note-list-empty">
          暂无笔记
        </div>
      </div>
    </div>

    <!-- 编辑区 -->
    <div class="note-editor">
      <template v-if="notepadStore.currentNote">
        <div class="editor-header">
          <n-input
            v-model:value="currentTitle"
            placeholder="笔记标题"
            :bordered="false"
            size="large"
            class="title-input"
            @blur="saveTitle"
          />
          <div class="editor-actions">
            <n-button quaternary size="small" @click="confirmDelete">
              <template #icon><n-icon :component="TrashOutline" /></template>
            </n-button>
          </div>
        </div>
        <div class="editor-toolbar" v-if="editor">
          <n-button-group size="small">
            <n-button :type="editor.isActive('bold') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleBold().run()">
              <strong>B</strong>
            </n-button>
            <n-button :type="editor.isActive('italic') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleItalic().run()">
              <em>I</em>
            </n-button>
            <n-button :type="editor.isActive('underline') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleUnderline().run()">
              <u>U</u>
            </n-button>
            <n-button :type="editor.isActive('strike') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleStrike().run()">
              <s>S</s>
            </n-button>
          </n-button-group>
          <n-button-group size="small">
            <n-button :type="editor.isActive('heading', { level: 1 }) ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleHeading({ level: 1 }).run()">
              H1
            </n-button>
            <n-button :type="editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleHeading({ level: 2 }).run()">
              H2
            </n-button>
            <n-button :type="editor.isActive('heading', { level: 3 }) ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleHeading({ level: 3 }).run()">
              H3
            </n-button>
          </n-button-group>
          <n-button-group size="small">
            <n-button :type="editor.isActive('bulletList') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleBulletList().run()">
              <n-icon :component="ListOutline" />
            </n-button>
            <n-button :type="editor.isActive('orderedList') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleOrderedList().run()">
              <n-icon :component="ListOutline" />
            </n-button>
            <n-button :type="editor.isActive('blockquote') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleBlockquote().run()">
              <n-icon :component="ChatboxEllipsesOutline" />
            </n-button>
            <n-button :type="editor.isActive('codeBlock') ? 'primary' : 'default'" quaternary @click="editor.chain().focus().toggleCodeBlock().run()">
              <n-icon :component="CodeSlashOutline" />
            </n-button>
          </n-button-group>
          <n-button size="small" quaternary @click="insertImage">
            <n-icon :component="ImageOutline" />
          </n-button>
        </div>
        <editor-content :editor="editor" class="editor-content" />
      </template>
      <template v-else>
        <div class="editor-empty">
          <n-empty description="选择一个笔记或新建一个" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NButtonGroup, NIcon, NInput, NEmpty, useMessage, useDialog } from 'naive-ui'
import {
  AddOutline, TrashOutline, ListOutline,
  ChatboxEllipsesOutline, CodeSlashOutline, ImageOutline,
} from '@vicons/ionicons5'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import UnderlineExt from '@tiptap/extension-underline'

import { useNotepadStore } from '../../stores/notepad'

const { t } = useI18n()
const notepadStore = useNotepadStore()
const message = useMessage()
const dialog = useDialog()

const currentTitle = ref('')
let saveTimer: ReturnType<typeof setTimeout> | null = null

const editor = useEditor({
  extensions: [
    StarterKit.configure({ strike: false }),
    Image,
    UnderlineExt,
    Placeholder.configure({ placeholder: '开始写作...' }),
  ],
  content: '',
  onUpdate: ({ editor: ed }) => {
    // 自动保存，防抖 800ms
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      if (notepadStore.currentNote) {
        notepadStore.updateNote(notepadStore.currentNote.id, {
          content: ed.getHTML(),
        })
      }
    }, 800)
  },
})

watch(() => notepadStore.currentNote, (note) => {
  if (note) {
    currentTitle.value = note.title
    editor.value?.commands.setContent(note.content || '')
  }
})

function saveTitle() {
  if (notepadStore.currentNote && currentTitle.value !== notepadStore.currentNote.title) {
    notepadStore.updateNote(notepadStore.currentNote.id, { title: currentTitle.value })
  }
}

async function handleCreate() {
  const id = await notepadStore.createNote()
  const newNote = notepadStore.notes.find(n => n.id === id)
  if (newNote) notepadStore.selectNote(newNote)
  message.success('笔记已创建')
}

function confirmDelete() {
  if (!notepadStore.currentNote) return
  dialog.warning({
    title: '确认删除',
    content: '笔记将移入回收站。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await notepadStore.deleteNote(notepadStore.currentNote!.id)
      message.success('已移入回收站')
    },
  })
}

function insertImage() {
  const url = window.prompt('输入图片 URL')
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run()
  }
}

function formatTime(time: string) {
  if (!time) return ''
  const d = new Date(time)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

onMounted(() => {
  notepadStore.loadNotes()
})

onBeforeUnmount(() => {
  if (saveTimer) clearTimeout(saveTimer)
  editor.value?.destroy()
})
</script>

<style scoped>
.notepad-page {
  display: flex;
  height: 100%;
  margin: -20px;
}

.note-sidebar {
  width: 240px;
  border-right: 1px solid var(--n-border-color, #e0e0e0);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.note-sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.note-sidebar-title {
  font-weight: 600;
  font-size: 15px;
}

.note-list {
  flex: 1;
  overflow-y: auto;
}

.note-list-item {
  padding: 10px 16px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  transition: background 0.15s;
}

.note-list-item:hover {
  background: rgba(128, 128, 128, 0.06);
}

.note-list-item.active {
  background: rgba(64, 152, 252, 0.08);
}

.note-list-title {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-list-time {
  font-size: 11px;
  opacity: 0.4;
  margin-top: 2px;
}

.note-list-empty {
  padding: 40px 16px;
  text-align: center;
  opacity: 0.4;
  font-size: 13px;
}

.note-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 12px 20px 0;
}

.title-input {
  flex: 1;
}

.title-input :deep(input) {
  font-size: 20px;
  font-weight: 600;
}

.editor-toolbar {
  display: flex;
  gap: 8px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--n-border-color, #e0e0e0);
  flex-wrap: wrap;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 20px;
}

.editor-content :deep(.tiptap) {
  outline: none;
  min-height: 100%;
  font-size: 14px;
  line-height: 1.7;
}

.editor-content :deep(.tiptap p.is-editor-empty:first-child::before) {
  color: #adb5bd;
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}

.editor-content :deep(.tiptap img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

.editor-content :deep(.tiptap pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
}

.editor-content :deep(.tiptap blockquote) {
  border-left: 3px solid rgba(0, 0, 0, 0.15);
  padding-left: 12px;
  opacity: 0.7;
}

.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
