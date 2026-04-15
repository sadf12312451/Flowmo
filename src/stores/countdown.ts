import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query, execute } from '../services/db'

export interface Countdown {
  id: number
  title: string
  description: string
  target_time: string
  remind_before: number
  sound_enabled: number
  sound_type: string
  color: string
  tags: string
  completed: number
  deleted: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const useCountdownStore = defineStore('countdown', () => {
  const countdowns = ref<Countdown[]>([])
  const loading = ref(false)

  async function loadCountdowns() {
    loading.value = true
    countdowns.value = await query<Countdown>(
      'SELECT * FROM countdowns WHERE deleted = 0 ORDER BY completed ASC, target_time ASC'
    )
    loading.value = false
  }

  async function createCountdown(data: Partial<Countdown>) {
    const result = await execute(
      'INSERT INTO countdowns (title, description, target_time, remind_before, sound_enabled, color) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        data.title || '',
        data.description || '',
        data.target_time || new Date().toISOString(),
        data.remind_before || 0,
        data.sound_enabled ?? 1,
        data.color || '#4098fc',
      ]
    )
    await loadCountdowns()
    return result.lastInsertId
  }

  async function updateCountdown(id: number, data: Partial<Countdown>) {
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'created_at') continue
      fields.push(`${key} = $${idx}`)
      values.push(value)
      idx++
    }

    fields.push(`updated_at = datetime('now', 'localtime')`)
    values.push(id)

    await execute(
      `UPDATE countdowns SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
    await loadCountdowns()
  }

  async function deleteCountdown(id: number) {
    await execute(
      "UPDATE countdowns SET deleted = 1, deleted_at = datetime('now', 'localtime') WHERE id = $1",
      [id]
    )
    await loadCountdowns()
  }

  async function markCompleted(id: number) {
    await execute(
      "UPDATE countdowns SET completed = 1, updated_at = datetime('now', 'localtime') WHERE id = $1",
      [id]
    )
    await loadCountdowns()
  }

  return { countdowns, loading, loadCountdowns, createCountdown, updateCountdown, deleteCountdown, markCompleted }
})
