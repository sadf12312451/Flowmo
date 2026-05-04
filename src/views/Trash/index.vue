<template>
  <div class="trash-page">
    <div class="page-header">
      <h2>{{ t('nav.trash') }}</h2>
      <n-button
        v-if="trashStore.items.length > 0"
        type="error"
        ghost
        @click="confirmEmpty"
      >
        <template #icon><n-icon :component="TrashOutline" /></template>
        清空回收站
      </n-button>
    </div>

    <n-spin :show="trashStore.loading">
      <div v-if="trashStore.items.length === 0 && !trashStore.loading" class="empty-state">
        <n-empty description="回收站是空的">
          <template #icon><n-icon :component="TrashOutline" /></template>
        </n-empty>
      </div>

      <div v-else class="trash-list">
        <div v-for="item in trashStore.items" :key="`${item.type}-${item.id}`" class="trash-item">
          <div class="trash-item-icon" :style="{ backgroundColor: item.color || typeColor(item.type) }">
            <n-icon :component="typeIcon(item.type)" :size="16" color="rgba(0,0,0,0.55)" />
          </div>
          <div class="trash-item-content">
            <div class="trash-item-title">
              <n-tag size="tiny" :bordered="false" :type="typeTag(item.type)">{{ typeName(item.type) }}</n-tag>
              <span>{{ item.title }}</span>
            </div>
            <div class="trash-item-preview">{{ item.preview || '（无内容）' }}</div>
            <div class="trash-item-time">删除于 {{ formatTime(item.deleted_at) }}</div>
          </div>
          <div class="trash-item-actions">
            <n-button quaternary size="small" @click="handleRestore(item)">
              <template #icon><n-icon :component="ReloadOutline" /></template>
              恢复
            </n-button>
            <n-button quaternary size="small" type="error" @click="confirmPermDelete(item)">
              <template #icon><n-icon :component="TrashOutline" /></template>
              永久删除
            </n-button>
          </div>
        </div>
      </div>
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NSpin, NEmpty, NTag, useMessage, useDialog } from 'naive-ui'
import {
  TrashOutline, ReloadOutline,
  DocumentTextOutline, BookOutline, CheckboxOutline, TimerOutline,
} from '@vicons/ionicons5'
import { useTrashStore, type TrashItem } from '../../stores/trash'

const { t } = useI18n()
const trashStore = useTrashStore()
const message = useMessage()
const dialog = useDialog()

function typeName(type: TrashItem['type']) {
  return { sticky: '便签', note: '笔记', todo: '待办', countdown: '倒计时' }[type]
}

function typeIcon(type: TrashItem['type']) {
  return { sticky: DocumentTextOutline, note: BookOutline, todo: CheckboxOutline, countdown: TimerOutline }[type]
}

function typeColor(type: TrashItem['type']) {
  return { sticky: '#fffae6', note: '#e0f7fa', todo: '#e8f5e9', countdown: '#e8eaf6' }[type]
}

function typeTag(type: TrashItem['type']): 'default' | 'info' | 'success' | 'warning' {
  return { sticky: 'warning', note: 'info', todo: 'success', countdown: 'default' }[type] as 'default' | 'info' | 'success' | 'warning'
}

function formatTime(time: string) {
  if (!time) return ''
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function handleRestore(item: TrashItem) {
  await trashStore.restore(item)
  message.success(`${typeName(item.type)}已恢复`)
}

function confirmPermDelete(item: TrashItem) {
  dialog.warning({
    title: '永久删除',
    content: '此操作无法撤销，确定要永久删除吗？',
    positiveText: '永久删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await trashStore.permanentDelete(item)
      message.success('已永久删除')
    },
  })
}

function confirmEmpty() {
  dialog.warning({
    title: '清空回收站',
    content: `将永久删除 ${trashStore.items.length} 项内容，此操作无法撤销。`,
    positiveText: '清空',
    negativeText: '取消',
    onPositiveClick: async () => {
      await trashStore.emptyTrash()
      message.success('回收站已清空')
    },
  })
}

onMounted(() => {
  trashStore.loadTrash()
})
</script>

<style scoped>
.trash-page {
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

.trash-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trash-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  background: rgba(128, 128, 128, 0.04);
  transition: background 0.15s;
}

.trash-item:hover {
  background: rgba(128, 128, 128, 0.08);
}

.trash-item-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.trash-item-content {
  flex: 1;
  min-width: 0;
}

.trash-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.trash-item-preview {
  font-size: 12px;
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trash-item-time {
  font-size: 11px;
  opacity: 0.4;
  margin-top: 4px;
}

.trash-item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.trash-item:hover .trash-item-actions {
  opacity: 1;
}
</style>
