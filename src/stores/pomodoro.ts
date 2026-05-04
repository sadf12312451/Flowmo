import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { query, execute } from '../services/db'

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak'

export interface PomodoroRecord {
  id: number
  duration: number
  started_at: string
  ended_at: string | null
  completed: number
  note: string
}

export const usePomodoroStore = defineStore('pomodoro', () => {
  // 配置
  const focusDuration = ref(25 * 60)        // 25 分钟
  const shortBreakDuration = ref(5 * 60)    // 5 分钟
  const longBreakDuration = ref(15 * 60)    // 15 分钟
  const longBreakInterval = ref(4)          // 每 4 个番茄一次长休息

  // 状态
  const mode = ref<PomodoroMode>('focus')
  const isRunning = ref(false)
  const remainingSeconds = ref(focusDuration.value)
  const completedFocusCount = ref(0)
  const sessionNote = ref('')
  const currentRecordStartedAt = ref<string | null>(null)

  // 历史记录
  const records = ref<PomodoroRecord[]>([])

  let timer: ReturnType<typeof setInterval> | null = null

  const totalSeconds = computed(() => {
    if (mode.value === 'focus') return focusDuration.value
    if (mode.value === 'shortBreak') return shortBreakDuration.value
    return longBreakDuration.value
  })

  const progress = computed(() =>
    100 - (remainingSeconds.value / totalSeconds.value) * 100
  )

  const formattedTime = computed(() => {
    const m = Math.floor(remainingSeconds.value / 60)
    const s = remainingSeconds.value % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  })

  function start() {
    if (isRunning.value) return
    isRunning.value = true
    if (mode.value === 'focus' && !currentRecordStartedAt.value) {
      currentRecordStartedAt.value = new Date().toISOString()
    }
    timer = setInterval(() => {
      if (remainingSeconds.value > 0) {
        remainingSeconds.value--
      } else {
        complete()
      }
    }, 1000)
  }

  function pause() {
    isRunning.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function reset() {
    pause()
    remainingSeconds.value = totalSeconds.value
    currentRecordStartedAt.value = null
  }

  async function complete() {
    pause()

    if (mode.value === 'focus' && currentRecordStartedAt.value) {
      // 记录完成的番茄钟
      await execute(
        'INSERT INTO pomodoro_records (duration, started_at, ended_at, completed, note) VALUES ($1, $2, $3, 1, $4)',
        [focusDuration.value, currentRecordStartedAt.value, new Date().toISOString(), sessionNote.value]
      )
      completedFocusCount.value++
      currentRecordStartedAt.value = null
      sessionNote.value = ''

      // 切换到休息模式
      const isLongBreak = completedFocusCount.value % longBreakInterval.value === 0
      mode.value = isLongBreak ? 'longBreak' : 'shortBreak'
    } else {
      // 休息结束，回到专注
      mode.value = 'focus'
    }

    remainingSeconds.value = totalSeconds.value
    await loadRecords()

    // 通知（可选 - 浏览器通知 API）
    if ('Notification' in window && Notification.permission === 'granted') {
      const msg = mode.value === 'focus' ? '休息结束，开始专注！' : '专注完成，休息一下！'
      new Notification('番茄钟', { body: msg })
    }
  }

  function switchMode(newMode: PomodoroMode) {
    pause()
    mode.value = newMode
    remainingSeconds.value = totalSeconds.value
    currentRecordStartedAt.value = null
  }

  async function loadRecords() {
    records.value = await query<PomodoroRecord>(
      "SELECT * FROM pomodoro_records WHERE completed = 1 ORDER BY started_at DESC LIMIT 100"
    )
  }

  // 今日统计
  const todayStats = computed(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayRecords = records.value.filter(r =>
      r.started_at && r.started_at.slice(0, 10) === today
    )
    const totalSec = todayRecords.reduce((sum, r) => sum + r.duration, 0)
    return {
      count: todayRecords.length,
      minutes: Math.round(totalSec / 60),
    }
  })

  return {
    focusDuration, shortBreakDuration, longBreakDuration, longBreakInterval,
    mode, isRunning, remainingSeconds, completedFocusCount, sessionNote,
    totalSeconds, progress, formattedTime, todayStats, records,
    start, pause, reset, complete, switchMode, loadRecords,
  }
})
