import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query, execute } from '../services/db'

export interface Habit {
  id: number
  name: string
  icon: string
  color: string
  target_days: string
  deleted: number
  deleted_at: string | null
  created_at: string
  // 计算字段
  todayChecked?: boolean
  streak?: number
  totalDays?: number
}

export interface HabitRecord {
  id: number
  habit_id: number
  checked_date: string
  note: string
}

export const useHabitsStore = defineStore('habits', () => {
  const habits = ref<Habit[]>([])
  const records = ref<HabitRecord[]>([])
  const loading = ref(false)

  function todayStr(): string {
    return new Date().toISOString().slice(0, 10)
  }

  async function loadHabits() {
    loading.value = true
    const list = await query<Habit>(
      "SELECT * FROM habits WHERE deleted = 0 ORDER BY created_at ASC"
    )
    records.value = await query<HabitRecord>(
      "SELECT * FROM habit_records ORDER BY checked_date DESC"
    )

    const today = todayStr()
    habits.value = list.map(h => {
      const recs = records.value.filter(r => r.habit_id === h.id)
      const todayChecked = recs.some(r => r.checked_date === today)
      const streak = computeStreak(recs.map(r => r.checked_date))
      return {
        ...h,
        todayChecked,
        streak,
        totalDays: recs.length,
      }
    })
    loading.value = false
  }

  function computeStreak(dates: string[]): number {
    if (dates.length === 0) return 0
    const set = new Set(dates)
    let streak = 0
    const cursor = new Date()
    // 如果今天没打卡，从昨天开始算
    if (!set.has(cursor.toISOString().slice(0, 10))) {
      cursor.setDate(cursor.getDate() - 1)
    }
    while (set.has(cursor.toISOString().slice(0, 10))) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  async function createHabit(data: Partial<Habit>) {
    await execute(
      'INSERT INTO habits (name, icon, color, target_days) VALUES ($1, $2, $3, $4)',
      [data.name || '', data.icon || '✓', data.color || '#18a058', data.target_days || '[]']
    )
    await loadHabits()
  }

  async function updateHabit(id: number, data: Partial<Habit>) {
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1
    for (const [key, value] of Object.entries(data)) {
      if (['id', 'created_at', 'todayChecked', 'streak', 'totalDays'].includes(key)) continue
      fields.push(`${key} = $${idx}`)
      values.push(value)
      idx++
    }
    values.push(id)
    await execute(`UPDATE habits SET ${fields.join(', ')} WHERE id = $${idx}`, values)
    await loadHabits()
  }

  async function deleteHabit(id: number) {
    await execute(
      "UPDATE habits SET deleted = 1, deleted_at = datetime('now', 'localtime') WHERE id = $1",
      [id]
    )
    await loadHabits()
  }

  async function checkIn(habitId: number, date?: string) {
    const d = date || todayStr()
    try {
      await execute(
        'INSERT INTO habit_records (habit_id, checked_date) VALUES ($1, $2)',
        [habitId, d]
      )
    } catch {
      // 已经打过卡（UNIQUE 约束）
    }
    await loadHabits()
  }

  async function uncheck(habitId: number, date?: string) {
    const d = date || todayStr()
    await execute(
      'DELETE FROM habit_records WHERE habit_id = $1 AND checked_date = $2',
      [habitId, d]
    )
    await loadHabits()
  }

  async function toggleToday(habitId: number) {
    const habit = habits.value.find(h => h.id === habitId)
    if (!habit) return
    if (habit.todayChecked) {
      await uncheck(habitId)
    } else {
      await checkIn(habitId)
    }
  }

  // 获取某个习惯近 N 天的打卡热力图数据
  function getHeatmap(habitId: number, days = 90): { date: string; checked: boolean }[] {
    const result: { date: string; checked: boolean }[] = []
    const habitRecs = new Set(
      records.value.filter(r => r.habit_id === habitId).map(r => r.checked_date)
    )
    const cursor = new Date()
    for (let i = 0; i < days; i++) {
      const dateStr = cursor.toISOString().slice(0, 10)
      result.unshift({ date: dateStr, checked: habitRecs.has(dateStr) })
      cursor.setDate(cursor.getDate() - 1)
    }
    return result
  }

  return {
    habits, records, loading,
    loadHabits, createHabit, updateHabit, deleteHabit,
    checkIn, uncheck, toggleToday, getHeatmap,
  }
})
