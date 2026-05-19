<template>
  <div class="tool-result-card" :class="{ success: result.success, error: !result.success }">
    <div class="result-header">
      <n-icon :component="result.success ? CheckmarkCircleOutline : CloseCircleOutline" />
      <span class="result-title">{{ getResultTitle() }}</span>
    </div>
    <div v-if="result.success && result.data" class="result-data">
      <div v-if="toolName === 'create_todo'" class="data-item">
        <span class="label">待办：</span>
        <span class="value">{{ result.data.title }}</span>
        <n-tag :type="getPriorityType(result.data.priority)" size="small">
          {{ getPriorityLabel(result.data.priority) }}
        </n-tag>
      </div>
      <div v-else-if="toolName === 'create_countdown'" class="data-item">
        <span class="label">提醒：</span>
        <span class="value">{{ result.data.title }}</span>
        <span class="time">{{ result.data.target_time }}</span>
      </div>
      <div v-else-if="toolName === 'create_sticky'" class="data-item">
        <span class="label">便签：</span>
        <span class="value">{{ result.data.title }}</span>
        <div class="color-dot" :style="{ background: getColorHex(result.data.color) }"></div>
      </div>
      <div v-else-if="toolName === 'create_note'" class="data-item">
        <span class="label">笔记：</span>
        <span class="value">{{ result.data.title }}</span>
      </div>
      <div v-else-if="toolName === 'search'" class="data-item">
        <span class="label">找到 {{ result.data.count }} 条结果</span>
      </div>
      <div v-else class="data-item">
        <span class="value">操作成功</span>
      </div>
    </div>
    <div v-else-if="!result.success" class="result-error">
      {{ result.error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { NIcon, NTag } from 'naive-ui'
import { CheckmarkCircleOutline, CloseCircleOutline } from '@vicons/ionicons5'
import type { ToolExecutionResult } from '../../services/ai'

interface Props {
  result: ToolExecutionResult
  toolName?: string
}

const props = defineProps<Props>()

function getResultTitle() {
  if (!props.result.success) return '操作失败'

  const titles: Record<string, string> = {
    create_todo: '已创建待办',
    create_countdown: '已创建提醒',
    create_sticky: '已创建便签',
    create_note: '已创建笔记',
    search: '搜索结果',
    update_item: '已更新',
    delete_item: '已删除',
  }
  return titles[props.toolName || ''] || '操作完成'
}

function getPriorityType(priority: string) {
  const types: Record<string, any> = {
    urgent: 'error',
    important: 'warning',
    normal: 'default',
  }
  return types[priority] || 'default'
}

function getPriorityLabel(priority: string) {
  const labels: Record<string, string> = {
    urgent: '紧急',
    important: '重要',
    normal: '一般',
  }
  return labels[priority] || priority
}

function getColorHex(color: string) {
  const colors: Record<string, string> = {
    yellow: '#ffd93d',
    green: '#6bcf7f',
    blue: '#4098fc',
    pink: '#ff6b9d',
    purple: '#c77dff',
    red: '#ff6b6b',
    orange: '#ffa94d',
  }
  return colors[color] || '#ccc'
}
</script>

<style scoped>
.tool-result-card {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid rgba(128, 128, 128, 0.15);
  background: rgba(128, 128, 128, 0.03);
}

.tool-result-card.success {
  border-color: rgba(64, 152, 252, 0.3);
  background: rgba(64, 152, 252, 0.05);
}

.tool-result-card.error {
  border-color: rgba(255, 107, 107, 0.3);
  background: rgba(255, 107, 107, 0.05);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.result-header .n-icon {
  font-size: 16px;
}

.success .result-header {
  color: #4098fc;
}

.error .result-header {
  color: #ff6b6b;
}

.result-data {
  font-size: 13px;
}

.data-item {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.label {
  opacity: 0.6;
}

.value {
  font-weight: 500;
}

.time {
  font-size: 12px;
  opacity: 0.6;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.result-error {
  font-size: 13px;
  color: #ff6b6b;
}
</style>
