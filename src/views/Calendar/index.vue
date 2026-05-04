<template>
  <div class="calendar-page">
    <div class="page-header">
      <h2>{{ t('nav.calendar') }}</h2>
      <div class="header-controls">
        <n-button quaternary circle size="small" @click="prevMonth">
          <template #icon><n-icon :component="ChevronBackOutline" /></template>
        </n-button>
        <span class="current-month">{{ currentMonthText }}</span>
        <n-button quaternary circle size="small" @click="nextMonth">
          <template #icon><n-icon :component="ChevronForwardOutline" /></template>
        </n-button>
        <n-button size="small" quaternary @click="goToday">今天</n-button>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend">
      <div class="legend-item"><span class="legend-dot" style="background: #4098fc" />倒计时</div>
      <div class="legend-item"><span class="legend-dot" style="background: #18a058" />待办</div>
      <div class="legend-item"><span class="legend-dot" style="background: #f0a020" />打卡</div>
    </div>

    <!-- 日历网格 -->
    <div class="calendar-body">
      <div class="weekdays">
        <div v-for="d in weekdays" :key="d" class="weekday">{{ d }}</div>
      </div>
      <div class="days-grid">
        <div
          v-for="day in calendarDays"
          :key="day.dateStr"
          class="day-cell"
          :class="{
            'other-month': !day.inMonth,
            'today': day.isToday,
            'selected': selectedDate === day.dateStr,
          }"
          @click="selectedDate = day.dateStr"
        >
          <div class="day-number">{{ day.day }}</div>
          <div class="day-events">
            <div
              v-for="(ev, i) in day.events.slice(0, 3)"
              :key="i"
              class="day-event"
              :style="{ backgroundColor: ev.color }"
              :title="ev.title"
            >
              {{ ev.title }}
            </div>
            <div v-if="day.events.length > 3" class="day-more">+{{ day.events.length - 3 }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中日期详情 -->
    <div v-if="selectedDayEvents.length > 0" class="day-detail">
      <div class="day-detail-title">{{ selectedDateText }} · {{ selectedDayEvents.length }} 项</div>
      <div class="day-detail-list">
        <div v-for="(ev, i) in selectedDayEvents" :key="i" class="day-detail-item">
          <span class="event-dot" :style="{ backgroundColor: ev.color }" />
          <span class="event-type">{{ ev.typeName }}</span>
          <span class="event-title">{{ ev.title }}</span>
          <span v-if="ev.time" class="event-time">{{ ev.time }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NIcon } from 'naive-ui'
import { ChevronBackOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import { useTodosStore } from '../../stores/todos'
import { useCountdownStore } from '../../stores/countdown'
import { useHabitsStore } from '../../stores/habits'

const { t } = useI18n()
const todosStore = useTodosStore()
const countdownStore = useCountdownStore()
const habitsStore = useHabitsStore()

const currentDate = ref(new Date())
const selectedDate = ref(new Date().toISOString().slice(0, 10))

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const currentMonthText = computed(() => {
  return `${currentDate.value.getFullYear()}年 ${currentDate.value.getMonth() + 1}月`
})

const selectedDateText = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value)
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

interface DayEvent {
  title: string
  color: string
  typeName: string
  time?: string
}

interface CalendarDay {
  dateStr: string
  day: number
  inMonth: boolean
  isToday: boolean
  events: DayEvent[]
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()

  const days: CalendarDay[] = []
  const todayStr = new Date().toISOString().slice(0, 10)

  // 上个月填充
  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLast - i)
    days.push(buildDay(d, false, todayStr))
  }

  // 本月
  const monthLast = new Date(year, month + 1, 0).getDate()
  for (let i = 1; i <= monthLast; i++) {
    const d = new Date(year, month, i)
    days.push(buildDay(d, true, todayStr))
  }

  // 下个月填充到 42 个格子（6行）
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - startWeekday - monthLast + 1)
    days.push(buildDay(d, false, todayStr))
  }

  return days
})

function buildDay(d: Date, inMonth: boolean, todayStr: string): CalendarDay {
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return {
    dateStr,
    day: d.getDate(),
    inMonth,
    isToday: dateStr === todayStr,
    events: getEventsForDate(dateStr),
  }
}

function getEventsForDate(dateStr: string): DayEvent[] {
  const events: DayEvent[] = []

  // 倒计时
  for (const c of countdownStore.countdowns) {
    if (c.target_time && c.target_time.slice(0, 10) === dateStr) {
      events.push({
        title: c.title,
        color: c.color || '#4098fc',
        typeName: '倒计时',
        time: new Date(c.target_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      })
    }
  }

  // 待办
  for (const t of todosStore.todos) {
    if (t.due_date && t.due_date.slice(0, 10) === dateStr) {
      events.push({
        title: t.title,
        color: t.completed ? '#a0a0a0' : '#18a058',
        typeName: '待办',
      })
    }
  }

  // 打卡
  for (const h of habitsStore.habits) {
    const checked = habitsStore.records.some(
      r => r.habit_id === h.id && r.checked_date === dateStr
    )
    if (checked) {
      events.push({
        title: `${h.icon} ${h.name}`,
        color: h.color || '#f0a020',
        typeName: '打卡',
      })
    }
  }

  return events
}

const selectedDayEvents = computed(() => {
  if (!selectedDate.value) return []
  return getEventsForDate(selectedDate.value)
})

function prevMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
}

function nextMonth() {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)
}

function goToday() {
  currentDate.value = new Date()
  selectedDate.value = new Date().toISOString().slice(0, 10)
}

onMounted(async () => {
  await Promise.all([
    todosStore.loadTodos(),
    countdownStore.loadCountdowns(),
    habitsStore.loadHabits(),
  ])
})
</script>

<style scoped>
.calendar-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-month {
  font-size: 15px;
  font-weight: 600;
  min-width: 110px;
  text-align: center;
}

.legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 12px;
  opacity: 0.7;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  display: inline-block;
}

.calendar-body {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(128, 128, 128, 0.15);
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: rgba(128, 128, 128, 0.06);
}

.weekday {
  padding: 8px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  opacity: 0.65;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-cell {
  min-height: 90px;
  padding: 6px;
  border-right: 1px solid rgba(128, 128, 128, 0.08);
  border-bottom: 1px solid rgba(128, 128, 128, 0.08);
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  flex-direction: column;
}

.day-cell:hover {
  background: rgba(64, 152, 252, 0.04);
}

.day-cell.other-month .day-number {
  opacity: 0.3;
}

.day-cell.today .day-number {
  color: #fff;
  background: #4098fc;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.day-cell.selected {
  background: rgba(64, 152, 252, 0.1);
  box-shadow: inset 0 0 0 2px #4098fc;
}

.day-number {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.day-event {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.day-more {
  font-size: 10px;
  opacity: 0.5;
  padding-left: 4px;
}

.day-detail {
  margin-top: 16px;
  padding: 12px 16px;
  background: rgba(128, 128, 128, 0.05);
  border-radius: 10px;
}

.day-detail-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.75;
}

.day-detail-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.day-detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.event-type {
  font-size: 11px;
  opacity: 0.5;
  width: 36px;
}

.event-title {
  flex: 1;
}

.event-time {
  font-size: 12px;
  opacity: 0.55;
  font-variant-numeric: tabular-nums;
}
</style>
