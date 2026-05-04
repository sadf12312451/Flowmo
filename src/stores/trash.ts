import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query, execute } from '../services/db'

export interface TrashItem {
  id: number
  type: 'sticky' | 'note' | 'todo' | 'countdown'
  title: string
  preview: string
  deleted_at: string
  color?: string
}

export const useTrashStore = defineStore('trash', () => {
  const items = ref<TrashItem[]>([])
  const loading = ref(false)

  async function loadTrash() {
    loading.value = true

    const stickies = await query<{ id: number; title: string; content: string; color: string; deleted_at: string }>(
      "SELECT id, title, content, color, deleted_at FROM sticky_notes WHERE deleted = 1 ORDER BY deleted_at DESC"
    )

    const notepads = await query<{ id: number; title: string; content: string; deleted_at: string }>(
      "SELECT id, title, content, deleted_at FROM notepad WHERE deleted = 1 ORDER BY deleted_at DESC"
    )

    const todos = await query<{ id: number; title: string; description: string; deleted_at: string }>(
      "SELECT id, title, description, deleted_at FROM todos WHERE deleted = 1 AND parent_id IS NULL ORDER BY deleted_at DESC"
    )

    const countdowns = await query<{ id: number; title: string; description: string; color: string; deleted_at: string }>(
      "SELECT id, title, description, color, deleted_at FROM countdowns WHERE deleted = 1 ORDER BY deleted_at DESC"
    )

    items.value = [
      ...stickies.map(s => ({
        id: s.id,
        type: 'sticky' as const,
        title: s.title || '无标题便签',
        preview: stripHtml(s.content).slice(0, 80),
        deleted_at: s.deleted_at,
        color: s.color,
      })),
      ...notepads.map(n => ({
        id: n.id,
        type: 'note' as const,
        title: n.title || '未命名笔记',
        preview: stripHtml(n.content).slice(0, 80),
        deleted_at: n.deleted_at,
      })),
      ...todos.map(t => ({
        id: t.id,
        type: 'todo' as const,
        title: t.title,
        preview: t.description.slice(0, 80),
        deleted_at: t.deleted_at,
      })),
      ...countdowns.map(c => ({
        id: c.id,
        type: 'countdown' as const,
        title: c.title,
        preview: c.description.slice(0, 80),
        deleted_at: c.deleted_at,
        color: c.color,
      })),
    ].sort((a, b) => (b.deleted_at || '').localeCompare(a.deleted_at || ''))

    loading.value = false
  }

  async function restore(item: TrashItem) {
    const tableMap: Record<TrashItem['type'], string> = {
      sticky: 'sticky_notes',
      note: 'notepad',
      todo: 'todos',
      countdown: 'countdowns',
    }
    await execute(
      `UPDATE ${tableMap[item.type]} SET deleted = 0, deleted_at = NULL WHERE id = $1`,
      [item.id]
    )
    // 待办的子任务一起恢复
    if (item.type === 'todo') {
      await execute(
        "UPDATE todos SET deleted = 0, deleted_at = NULL WHERE parent_id = $1",
        [item.id]
      )
    }
    await loadTrash()
  }

  async function permanentDelete(item: TrashItem) {
    const tableMap: Record<TrashItem['type'], string> = {
      sticky: 'sticky_notes',
      note: 'notepad',
      todo: 'todos',
      countdown: 'countdowns',
    }
    await execute(`DELETE FROM ${tableMap[item.type]} WHERE id = $1`, [item.id])
    if (item.type === 'todo') {
      await execute("DELETE FROM todos WHERE parent_id = $1", [item.id])
    }
    await loadTrash()
  }

  async function emptyTrash() {
    await execute("DELETE FROM sticky_notes WHERE deleted = 1")
    await execute("DELETE FROM notepad WHERE deleted = 1")
    await execute("DELETE FROM todos WHERE deleted = 1")
    await execute("DELETE FROM countdowns WHERE deleted = 1")
    await loadTrash()
  }

  return { items, loading, loadTrash, restore, permanentDelete, emptyTrash }
})

function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
