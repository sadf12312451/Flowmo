import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query } from '../services/db'

export interface SearchResult {
  id: number
  type: 'sticky' | 'note' | 'todo' | 'countdown' | 'habit'
  title: string
  preview: string
  matchIn: 'title' | 'content'
}

export const useSearchStore = defineStore('search', () => {
  const keyword = ref('')
  const results = ref<SearchResult[]>([])
  const isSearching = ref(false)
  const showSearchPanel = ref(false)

  async function search(kw: string) {
    keyword.value = kw
    if (!kw.trim()) {
      results.value = []
      return
    }

    isSearching.value = true
    const pattern = `%${kw}%`
    const all: SearchResult[] = []

    // 便签
    const stickies = await query<{ id: number; title: string; content: string }>(
      "SELECT id, title, content FROM sticky_notes WHERE deleted = 0 AND (title LIKE $1 OR content LIKE $1) ORDER BY updated_at DESC LIMIT 30",
      [pattern]
    )
    for (const s of stickies) {
      const matchInTitle = (s.title || '').toLowerCase().includes(kw.toLowerCase())
      all.push({
        id: s.id,
        type: 'sticky',
        title: s.title || '无标题便签',
        preview: stripAndHighlight(s.content, kw),
        matchIn: matchInTitle ? 'title' : 'content',
      })
    }

    // 笔记
    const notes = await query<{ id: number; title: string; content: string }>(
      "SELECT id, title, content FROM notepad WHERE deleted = 0 AND (title LIKE $1 OR content LIKE $1) ORDER BY updated_at DESC LIMIT 30",
      [pattern]
    )
    for (const n of notes) {
      const matchInTitle = (n.title || '').toLowerCase().includes(kw.toLowerCase())
      all.push({
        id: n.id,
        type: 'note',
        title: n.title || '未命名笔记',
        preview: stripAndHighlight(n.content, kw),
        matchIn: matchInTitle ? 'title' : 'content',
      })
    }

    // 待办
    const todos = await query<{ id: number; title: string; description: string }>(
      "SELECT id, title, description FROM todos WHERE deleted = 0 AND (title LIKE $1 OR description LIKE $1) ORDER BY updated_at DESC LIMIT 30",
      [pattern]
    )
    for (const t of todos) {
      const matchInTitle = t.title.toLowerCase().includes(kw.toLowerCase())
      all.push({
        id: t.id,
        type: 'todo',
        title: t.title,
        preview: stripAndHighlight(t.description, kw),
        matchIn: matchInTitle ? 'title' : 'content',
      })
    }

    // 倒计时
    const countdowns = await query<{ id: number; title: string; description: string }>(
      "SELECT id, title, description FROM countdowns WHERE deleted = 0 AND (title LIKE $1 OR description LIKE $1) ORDER BY updated_at DESC LIMIT 30",
      [pattern]
    )
    for (const c of countdowns) {
      const matchInTitle = c.title.toLowerCase().includes(kw.toLowerCase())
      all.push({
        id: c.id,
        type: 'countdown',
        title: c.title,
        preview: stripAndHighlight(c.description, kw),
        matchIn: matchInTitle ? 'title' : 'content',
      })
    }

    // 习惯
    const habits = await query<{ id: number; name: string; icon: string }>(
      "SELECT id, name, icon FROM habits WHERE deleted = 0 AND name LIKE $1 LIMIT 20",
      [pattern]
    )
    for (const h of habits) {
      all.push({
        id: h.id,
        type: 'habit',
        title: `${h.icon} ${h.name}`,
        preview: '',
        matchIn: 'title',
      })
    }

    results.value = all
    isSearching.value = false
  }

  function clear() {
    keyword.value = ''
    results.value = []
    showSearchPanel.value = false
  }

  return { keyword, results, isSearching, showSearchPanel, search, clear }
})

function stripAndHighlight(html: string, kw: string): string {
  const text = (html || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const lower = text.toLowerCase()
  const kwLower = kw.toLowerCase()
  const idx = lower.indexOf(kwLower)
  if (idx === -1) return text.slice(0, 100)
  const start = Math.max(0, idx - 30)
  const end = Math.min(text.length, idx + kw.length + 60)
  let snippet = text.slice(start, end)
  if (start > 0) snippet = '...' + snippet
  if (end < text.length) snippet = snippet + '...'
  return snippet
}
