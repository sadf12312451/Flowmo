<template>
  <div class="countdown-page">
    <div class="page-header">
      <h2>{{ t('nav.countdown') }}</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon><n-icon :component="AddOutline" /></template>
        {{ t('common.create') }}
      </n-button>
    </div>

    <n-spin :show="countdownStore.loading">
      <div v-if="countdownStore.countdowns.length === 0 && !countdownStore.loading" class="empty-state">
        <n-empty description="还没有倒计时，添加一个重要时刻吧" />
      </div>

      <div v-else class="countdown-grid">
        <div
          v-for="item in countdownStore.countdowns"
          :key="item.id"
          class="countdown-card"
          :class="{ completed: item.completed }"
          :style="{ borderLeftColor: item.color }"
        >
          <div class="countdown-card-header">
            <span class="countdown-title">{{ item.title }}</span>
            <div class="countdown-card-actions">
              <n-button quaternary circle size="tiny" @click="handleEdit(item)">
                <template #icon><n-icon :component="CreateOutline" /></template>
              </n-button>
              <n-button quaternary circle size="tiny" @click="confirmDelete(item)">
                <template #icon><n-icon :component="TrashOutline" /></template>
              </n-button>
            </div>
          </div>

          <div v-if="item.description" class="countdown-desc">{{ item.description }}</div>

          <div class="countdown-timer">
            <template v-if="item.completed">
              <span class="timer-done">已完成</span>
            </template>
            <template v-else>
              <div class="timer-display">
                <div class="timer-block">
                  <span class="timer-num">{{ getRemaining(item.target_time).days }}</span>
                  <span class="timer-label">天</span>
                </div>
                <div class="timer-block">
                  <span class="timer-num">{{ getRemaining(item.target_time).hours }}</span>
                  <span class="timer-label">时</span>
                </div>
                <div class="timer-block">
                  <span class="timer-num">{{ getRemaining(item.target_time).minutes }}</span>
                  <span class="timer-label">分</span>
                </div>
                <div class="timer-block">
                  <span class="timer-num">{{ getRemaining(item.target_time).seconds }}</span>
                  <span class="timer-label">秒</span>
                </div>
              </div>
            </template>
          </div>

          <div class="countdown-target">
            目标: {{ formatTarget(item.target_time) }}
          </div>
        </div>
      </div>
    </n-spin>

    <!-- 编辑弹窗 -->
    <n-modal v-model:show="showEditor" preset="card" :title="editingItem ? '编辑倒计时' : '新建倒计时'" style="width: 480px;">
      <n-form>
        <n-form-item label="标题">
          <n-input v-model:value="form.title" placeholder="倒计时名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="form.description" type="textarea" placeholder="描述（可选）" :rows="2" />
        </n-form-item>
        <n-form-item label="目标时间">
          <n-date-picker v-model:value="targetTs" type="datetime" style="width: 100%" />
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
        <n-form-item label="提前提醒">
          <n-select v-model:value="form.remind_before" :options="remindOptions" />
        </n-form-item>
        <n-form-item label="到期声音">
          <n-switch v-model:value="soundEnabled" />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditor = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleSave" :disabled="!form.title.trim()">{{ t('common.save') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton, NIcon, NModal, NForm, NFormItem, NInput,
  NDatePicker, NSelect, NSwitch, NSpace, NSpin, NEmpty,
  useMessage, useDialog,
} from 'naive-ui'
import { AddOutline, CreateOutline, TrashOutline } from '@vicons/ionicons5'
import { useCountdownStore, type Countdown } from '../../stores/countdown'

const { t } = useI18n()
const countdownStore = useCountdownStore()
const message = useMessage()
const dialog = useDialog()

const showEditor = ref(false)
const editingItem = ref<Countdown | null>(null)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

const form = ref({
  title: '',
  description: '',
  target_time: '',
  color: '#4098fc',
  remind_before: 0,
  sound_enabled: 1,
})

const soundEnabled = computed({
  get: () => !!form.value.sound_enabled,
  set: (val) => { form.value.sound_enabled = val ? 1 : 0 },
})

const targetTs = computed({
  get: () => form.value.target_time ? new Date(form.value.target_time).getTime() : null,
  set: (val) => { form.value.target_time = val ? new Date(val).toISOString() : '' },
})

const colorOptions = [
  '#4098fc', '#18a058', '#f0a020', '#e03050',
  '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280',
]

const remindOptions = [
  { label: '不提醒', value: 0 },
  { label: '提前 5 分钟', value: 5 },
  { label: '提前 15 分钟', value: 15 },
  { label: '提前 30 分钟', value: 30 },
  { label: '提前 1 小时', value: 60 },
  { label: '提前 1 天', value: 1440 },
]

function getRemaining(target: string) {
  const diff = Math.max(0, new Date(target).getTime() - now.value)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds, expired: diff === 0 }
}

function formatTarget(target: string) {
  return new Date(target).toLocaleString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function handleCreate() {
  editingItem.value = null
  form.value = { title: '', description: '', target_time: '', color: '#4098fc', remind_before: 0, sound_enabled: 1 }
  showEditor.value = true
}

function handleEdit(item: Countdown) {
  editingItem.value = item
  form.value = {
    title: item.title,
    description: item.description,
    target_time: item.target_time,
    color: item.color,
    remind_before: item.remind_before,
    sound_enabled: item.sound_enabled,
  }
  showEditor.value = true
}

async function handleSave() {
  if (!form.value.title.trim()) return
  if (editingItem.value) {
    await countdownStore.updateCountdown(editingItem.value.id, form.value)
    message.success('倒计时已更新')
  } else {
    await countdownStore.createCountdown(form.value)
    message.success('倒计时已创建')
  }
  showEditor.value = false
}

function confirmDelete(item: Countdown) {
  dialog.warning({
    title: '确认删除',
    content: '倒计时将移入回收站。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await countdownStore.deleteCountdown(item.id)
      message.success('已移入回收站')
    },
  })
}

onMounted(() => {
  countdownStore.loadCountdowns()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})
</script>

<style scoped>
.countdown-page {
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

.countdown-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.countdown-card {
  border-radius: 12px;
  padding: 18px;
  border-left: 4px solid;
  background: var(--n-color, #fff);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.countdown-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.countdown-card.completed {
  opacity: 0.5;
}

.countdown-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.countdown-title {
  font-size: 16px;
  font-weight: 600;
}

.countdown-card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.countdown-card:hover .countdown-card-actions {
  opacity: 1;
}

.countdown-desc {
  font-size: 13px;
  opacity: 0.6;
  margin-bottom: 12px;
}

.countdown-timer {
  margin: 16px 0;
}

.timer-display {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.timer-block {
  text-align: center;
}

.timer-num {
  display: block;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.timer-label {
  font-size: 11px;
  opacity: 0.5;
  margin-top: 4px;
}

.timer-done {
  text-align: center;
  display: block;
  font-size: 16px;
  opacity: 0.5;
}

.countdown-target {
  font-size: 12px;
  opacity: 0.4;
  text-align: center;
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
