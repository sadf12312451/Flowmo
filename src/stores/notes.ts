import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query, execute } from '../services/db'

export interface StickyNote {
  id: number
  title: string
  content: string
  color: string
  pinned: number
  opacity: number
  pos_x: number | null
  pos_y: number | null
  width: number
  height: number
  tags: string
  deleted: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const useNotesStore = defineStore('notes', () => {
  const notes = ref<StickyNote[]>([])
  const loading = ref(false)

  async function loadNotes() {
    loading.value = true
    notes.value = await query<StickyNote>(
      'SELECT * FROM sticky_notes WHERE deleted = 0 ORDER BY pinned DESC, updated_at DESC'
    )
    loading.value = false
  }

  async function createNote(data: Partial<StickyNote> = {}) {
    const result = await execute(
      'INSERT INTO sticky_notes (title, content, color) VALUES ($1, $2, $3)',
      [data.title || '', data.content || '', data.color || '#fffae6']
    )
    await loadNotes()
    return result.lastInsertId
  }

  async function updateNote(id: number, data: Partial<StickyNote>) {
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
      `UPDATE sticky_notes SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
    await loadNotes()
  }

  async function deleteNote(id: number) {
    await execute(
      "UPDATE sticky_notes SET deleted = 1, deleted_at = datetime('now', 'localtime') WHERE id = $1",
      [id]
    )
    await loadNotes()
  }

  async function togglePin(id: number) {
    const note = notes.value.find(n => n.id === id)
    if (!note) return
    await updateNote(id, { pinned: note.pinned ? 0 : 1 })
  }

  return { notes, loading, loadNotes, createNote, updateNote, deleteNote, togglePin }
})
