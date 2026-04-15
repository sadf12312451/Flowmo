import { defineStore } from 'pinia'
import { ref } from 'vue'
import { query, execute } from '../services/db'

export interface Todo {
  id: number
  parent_id: number | null
  title: string
  description: string
  completed: number
  priority: number
  sort_order: number
  due_date: string | null
  repeat_type: string | null
  repeat_interval: number | null
  tags: string
  deleted: number
  deleted_at: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
  children?: Todo[]
}

export const useTodosStore = defineStore('todos', () => {
  const todos = ref<Todo[]>([])
  const loading = ref(false)

  async function loadTodos() {
    loading.value = true
    const all = await query<Todo>(
      'SELECT * FROM todos WHERE deleted = 0 ORDER BY completed ASC, priority DESC, sort_order ASC, created_at DESC'
    )
    // 组装两层结构
    const parents = all.filter(t => !t.parent_id)
    const childMap = new Map<number, Todo[]>()
    for (const t of all.filter(t => t.parent_id)) {
      const list = childMap.get(t.parent_id!) || []
      list.push(t)
      childMap.set(t.parent_id!, list)
    }
    todos.value = parents.map(p => ({
      ...p,
      children: childMap.get(p.id) || [],
    }))
    loading.value = false
  }

  async function createTodo(data: Partial<Todo>) {
    const result = await execute(
      'INSERT INTO todos (title, description, priority, parent_id, due_date, repeat_type, repeat_interval) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        data.title || '',
        data.description || '',
        data.priority || 0,
        data.parent_id || null,
        data.due_date || null,
        data.repeat_type || null,
        data.repeat_interval || null,
      ]
    )
    await loadTodos()
    return result.lastInsertId
  }

  async function updateTodo(id: number, data: Partial<Todo>) {
    const fields: string[] = []
    const values: unknown[] = []
    let idx = 1

    for (const [key, value] of Object.entries(data)) {
      if (key === 'id' || key === 'created_at' || key === 'children') continue
      fields.push(`${key} = $${idx}`)
      values.push(value)
      idx++
    }

    fields.push(`updated_at = datetime('now', 'localtime')`)
    values.push(id)

    await execute(
      `UPDATE todos SET ${fields.join(', ')} WHERE id = $${idx}`,
      values
    )
    await loadTodos()
  }

  async function toggleComplete(id: number) {
    const todo = findTodo(id)
    if (!todo) return
    const completed = todo.completed ? 0 : 1
    await execute(
      `UPDATE todos SET completed = $1, completed_at = $2, updated_at = datetime('now', 'localtime') WHERE id = $3`,
      [completed, completed ? new Date().toISOString() : null, id]
    )
    // 如果是父任务完成，同时完成所有子任务
    if (completed && !todo.parent_id) {
      await execute(
        `UPDATE todos SET completed = 1, completed_at = $1, updated_at = datetime('now', 'localtime') WHERE parent_id = $2 AND deleted = 0`,
        [new Date().toISOString(), id]
      )
    }
    // 周期任务：完成后自动生成下一个
    if (completed && todo.repeat_type) {
      await generateNextRepeat(todo)
    }
    await loadTodos()
  }

  async function generateNextRepeat(todo: Todo) {
    if (!todo.due_date || !todo.repeat_type) return
    const dueDate = new Date(todo.due_date)
    const interval = todo.repeat_interval || 1

    switch (todo.repeat_type) {
      case 'daily':
        dueDate.setDate(dueDate.getDate() + interval)
        break
      case 'weekly':
        dueDate.setDate(dueDate.getDate() + 7 * interval)
        break
      case 'monthly':
        dueDate.setMonth(dueDate.getMonth() + interval)
        break
    }

    await execute(
      'INSERT INTO todos (title, description, priority, due_date, repeat_type, repeat_interval) VALUES ($1, $2, $3, $4, $5, $6)',
      [todo.title, todo.description, todo.priority, dueDate.toISOString(), todo.repeat_type, todo.repeat_interval]
    )
  }

  async function deleteTodo(id: number) {
    await execute(
      "UPDATE todos SET deleted = 1, deleted_at = datetime('now', 'localtime') WHERE id = $1 OR parent_id = $1",
      [id]
    )
    await loadTodos()
  }

  function findTodo(id: number): Todo | undefined {
    for (const t of todos.value) {
      if (t.id === id) return t
      if (t.children) {
        const child = t.children.find(c => c.id === id)
        if (child) return child
      }
    }
    return undefined
  }

  return { todos, loading, loadTodos, createTodo, updateTodo, toggleComplete, deleteTodo }
})
