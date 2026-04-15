import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query, execute } from '../services/db'

export interface NotepadItem {
  id: number
  title: string
  content: string
  content_type: string
  tags: string
  deleted: number
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export const useNotepadStore = defineStore('notepad', () => {
  const notes = ref<NotepadItem[]>([])
  const loading = ref(false)
  const currentNote = ref<NotepadItem | null>(null)

  async function loadNotes() {
    loading.value = true
    notes.value = await query<NotepadItem>(
      'SELECT * FROM notepad WHERE deleted = 0 ORDER BY updated_at DESC'
    )
    loading.value = false
  }

  async function createNote(data: Partial<NotepadItem> = {}) {
    const result = await execute(
      'INSERT INTO notepad (title, content, content_type) VALUES ($1, $2, $3)',
      [data.title || '未命名笔记', data.content || '', data.content_type || 'richtext']
    )
    await loadNotes()
    return result.lastInsertId
  }

  async function updateNote(id: number, data: Partial<NotepadItem>) {
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
      `UPDATE notepad SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
    await loadNotes()
  }

  async function deleteNote(id: number) {
    await execute(
      "UPDATE notepad SET deleted = 1, deleted_at = datetime('now', 'localtime') WHERE id = $1",
      [id]
    )
    if (currentNote.value?.id === id) {
      currentNote.value = null
    }
    await loadNotes()
  }

  function selectNote(note: NotepadItem) {
    currentNote.value = note
  }

  return { notes, loading, currentNote, loadNotes, createNote, updateNote, deleteNote, selectNote }
})
