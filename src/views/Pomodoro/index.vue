<template>
  <div class="pomodoro-page">
    <div class="page-header">
      <h2>{{ t('nav.pomodoro') }}</h2>
      <div class="today-stats">
        今日 <strong>{{ pomodoroStore.todayStats.count }}</strong> 个番茄
        · 专注 <strong>{{ pomodoroStore.todayStats.minutes }}</strong> 分钟
      </div>
    </div>

    <div class="timer-area">
      <!-- 模式切换 -->
      <div class="mode-tabs">
        <div
          class="mode-tab"
          :class="{ active: pomodoroStore.mode === 'focus' }"
          @click="pomodoroStore.switchMode('focus')"
        >
          专注
        </div>
        <div
          class="mode-tab"
          :class="{ active: pomodoroStore.mode === 'shortBreak' }"
          @click="pomodoroStore.switchMode('shortBreak')"
        >
          短休
        </div>
        <div
          class="mode-tab"
          :class="{ active: pomodoroStore.mode === 'longBreak' }"
          @click="pomodoroStore.switchMode('longBreak')"
        >
          长休
        </div>
      </div>

      <!-- 圆形进度 + 倒计时 -->
      <div class="timer-circle-wrap">
        <svg class="timer-svg" viewBox="0 0 200 200">
          <circle
            class="timer-bg"
            cx="100" cy="100" r="92"
          />
          <circle
            class="timer-progress"
            :class="modeClass"
            cx="100" cy="100" r="92"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="timer-center">
          <div class="timer-time">{{ pomodoroStore.formattedTime }}</div>
          <div class="timer-mode">{{ modeText }}</div>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="timer-controls">
        <n-button
          v-if="!pomodoroStore.isRunning"
          type="primary"
          size="large"
          round
          @click="pomodoroStore.start"
        >
          <template #icon><n-icon :component="PlayOutline" /></template>
          开始
        </n-button>
        <n-button
          v-else
          size="large"
          round
          @click="pomodoroStore.pause"
        >
          <template #icon><n-icon :component="PauseOutline" /></template>
          暂停
        </n-button>
        <n-button size="large" round quaternary @click="pomodoroStore.reset">
          <template #icon><n-icon :component="RefreshOutline" /></template>
          重置
        </n-button>
      </div>

      <!-- 本次专注备注 -->
      <div v-if="pomodoroStore.mode === 'focus'" class="session-note">
        <n-input
          v-model:value="pomodoroStore.sessionNote"
          placeholder="本次专注做什么？（可选）"
          size="small"
          :bordered="false"
        />
      </div>
    </div>

    <!-- 历史记录 -->
    <div class="history-section">
      <div class="section-title">最近记录</div>
      <div v-if="pomodoroStore.records.length === 0" class="history-empty">
        还没有完成的番茄钟，开始第一个吧
      </div>
      <div v-else class="history-list">
        <div v-for="r in pomodoroStore.records.slice(0, 10)" :key="r.id" class="history-item">
          <div class="history-time">{{ formatTime(r.started_at) }}</div>
          <div class="history-duration">{{ Math.round(r.duration / 60) }} 分钟</div>
          <div class="history-note">{{ r.note || '专注' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon, NInput } from 'naive-ui'
import { PlayOutline, PauseOutline, RefreshOutline } from '@vicons/ionicons5'
import { usePomodoroStore } from '../../stores/pomodoro'

const { t } = useI18n()
const pomodoroStore = usePomodoroStore()

const circumference = 2 * Math.PI * 92

const dashOffset = computed(() => {
  return circumference - (pomodoroStore.progress / 100) * circumference
})

const modeText = computed(() => ({
  focus: '专注中',
  shortBreak: '短休息',
  longBreak: '长休息',
}[pomodoroStore.mode]))

const modeClass = computed(() => `mode-${pomodoroStore.mode}`)

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
  pomodoroStore.loadRecords()
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
})

onBeforeUnmount(() => {
  // 离开页面时不停止计时器（保持后台运行）
})
</script>

<style scoped>
.pomodoro-page {
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

.today-stats {
  font-size: 13px;
  opacity: 0.7;
}

.today-stats strong {
  font-size: 16px;
  color: #f0a020;
  margin: 0 2px;
}

.timer-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px 0;
}

.mode-tabs {
  display: flex;
  gap: 4px;
  background: rgba(128, 128, 128, 0.08);
  padding: 4px;
  border-radius: 24px;
}

.mode-tab {
  padding: 6px 18px;
  font-size: 13px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s;
}

.mode-tab:hover { background: rgba(128, 128, 128, 0.08); }
.mode-tab.active {
  background: var(--n-color, #fff);
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.timer-circle-wrap {
  position: relative;
  width: 240px;
  height: 240px;
}

.timer-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.timer-bg {
  fill: none;
  stroke: rgba(128, 128, 128, 0.12);
  stroke-width: 8;
}

.timer-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 1s linear;
}

.mode-focus { stroke: #f0a020; }
.mode-shortBreak { stroke: #18a058; }
.mode-longBreak { stroke: #4098fc; }

.timer-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.timer-time {
  font-size: 48px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}

.timer-mode {
  font-size: 13px;
  opacity: 0.5;
  margin-top: 4px;
}

.timer-controls {
  display: flex;
  gap: 12px;
}

.session-note {
  width: 320px;
  text-align: center;
}

.history-section {
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid rgba(128, 128, 128, 0.12);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  opacity: 0.65;
  margin-bottom: 12px;
}

.history-empty {
  text-align: center;
  font-size: 13px;
  opacity: 0.4;
  padding: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: grid;
  grid-template-columns: 80px 80px 1fr;
  gap: 12px;
  padding: 8px 12px;
  font-size: 13px;
  border-radius: 6px;
  transition: background 0.15s;
}

.history-item:hover { background: rgba(128, 128, 128, 0.06); }

.history-time { opacity: 0.5; font-variant-numeric: tabular-nums; }
.history-duration { color: #f0a020; font-weight: 500; }
.history-note { opacity: 0.75; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
