import type { ToolDefinition, ToolExecutionResult } from './types'
import { query, execute } from '../db'

// ==================== 工具定义 ====================

export const TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'create_todo',
      description: '创建一个新的待办事项',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '待办标题' },
          description: { type: 'string', description: '待办描述（可选）' },
          priority: { type: 'string', description: '优先级', enum: ['urgent', 'important', 'normal'] },
          due_date: { type: 'string', description: '截止日期 YYYY-MM-DD（可选）' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_countdown',
      description: '创建一个倒计时提醒',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '提醒标题' },
          description: { type: 'string', description: '提醒描述（可选）' },
          target_time: { type: 'string', description: '目标时间 YYYY-MM-DD HH:mm' },
          color: { type: 'string', description: '颜色', enum: ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] },
        },
        required: ['title', 'target_time'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_sticky',
      description: '创建一个便签',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '便签标题（可选）' },
          content: { type: 'string', description: '便签内容' },
          color: { type: 'string', description: '颜色', enum: ['yellow', 'green', 'blue', 'pink', 'purple'] },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: '创建一个笔记',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '笔记标题' },
          content: { type: 'string', description: '笔记内容（可选）' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search',
      description: '搜索便签、笔记、待办、倒计时',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: '搜索关键词' },
          type: { type: 'string', description: '搜索类型（可选）', enum: ['sticky', 'note', 'todo', 'countdown', 'all'] },
        },
        required: ['keyword'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_item',
      description: '更新便签、笔记、待办或倒计时',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: '类型', enum: ['sticky', 'note', 'todo', 'countdown'] },
          id: { type: 'number', description: '项目 ID' },
          updates: { type: 'object', description: '要更新的字段（JSON 对象）' },
        },
        required: ['type', 'id', 'updates'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_item',
      description: '删除便签、笔记、待办或倒计时（移到回收站）',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', description: '类型', enum: ['sticky', 'note', 'todo', 'countdown'] },
          id: { type: 'number', description: '项目 ID' },
        },
        required: ['type', 'id'],
      },
    },
  },
]

// ==================== 工具执行函数 ====================

export async function executeTool(name: string, args: any): Promise<ToolExecutionResult> {
  try {
    switch (name) {
      case 'create_todo':
        return await createTodo(args)
      case 'create_countdown':
        return await createCountdown(args)
      case 'create_sticky':
        return await createSticky(args)
      case 'create_note':
        return await createNote(args)
      case 'search':
        return await searchItems(args)
      case 'update_item':
        return await updateItem(args)
      case 'delete_item':
        return await deleteItem(args)
      default:
        return { success: false, error: `未知工具: ${name}` }
    }
  } catch (error: any) {
    return { success: false, error: error.message || String(error) }
  }
}

// ==================== 具体实现 ====================

async function createTodo(args: any): Promise<ToolExecutionResult> {
  const { title, description = '', priority = 'normal', due_date } = args

  const result = await execute(
    `INSERT INTO todos (title, description, priority, due_date, completed, deleted, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, 0, datetime('now'), datetime('now'))`,
    [title, description, priority, due_date || null]
  )

  return {
    success: true,
    data: { id: result.lastInsertId, title, priority },
  }
}

async function createCountdown(args: any): Promise<ToolExecutionResult> {
  const { title, description = '', target_time, color = 'blue' } = args

  const result = await execute(
    `INSERT INTO countdowns (title, description, target_time, color, sound_enabled, advance_remind, deleted, created_at, updated_at)
     VALUES (?, ?, ?, ?, 1, 0, 0, datetime('now'), datetime('now'))`,
    [title, description, target_time, color]
  )

  return {
    success: true,
    data: { id: result.lastInsertId, title, target_time },
  }
}

async function createSticky(args: any): Promise<ToolExecutionResult> {
  const { title = '', content, color = 'yellow' } = args

  const result = await execute(
    `INSERT INTO sticky_notes (title, content, color, pinned, deleted, created_at, updated_at)
     VALUES (?, ?, ?, 0, 0, datetime('now'), datetime('now'))`,
    [title, content, color]
  )

  return {
    success: true,
    data: { id: result.lastInsertId, title: title || '无标题', color },
  }
}

async function createNote(args: any): Promise<ToolExecutionResult> {
  const { title, content = '' } = args

  const result = await execute(
    `INSERT INTO notepad (title, content, deleted, created_at, updated_at)
     VALUES (?, ?, 0, datetime('now'), datetime('now'))`,
    [title, content]
  )

  return {
    success: true,
    data: { id: result.lastInsertId, title },
  }
}

async function searchItems(args: any): Promise<ToolExecutionResult> {
  const { keyword, type = 'all' } = args
  const results: any[] = []

  if (type === 'all' || type === 'sticky') {
    const stickies = await query(
      `SELECT id, title, content, color FROM sticky_notes
       WHERE deleted = 0 AND (title LIKE ? OR content LIKE ?) LIMIT 5`,
      [`%${keyword}%`, `%${keyword}%`]
    )
    results.push(...stickies.map((s: any) => ({ type: 'sticky', ...s })))
  }

  if (type === 'all' || type === 'note') {
    const notes = await query(
      `SELECT id, title, content FROM notepad
       WHERE deleted = 0 AND (title LIKE ? OR content LIKE ?) LIMIT 5`,
      [`%${keyword}%`, `%${keyword}%`]
    )
    results.push(...notes.map((n: any) => ({ type: 'note', ...n })))
  }

  if (type === 'all' || type === 'todo') {
    const todos = await query(
      `SELECT id, title, description, priority FROM todos
       WHERE deleted = 0 AND (title LIKE ? OR description LIKE ?) LIMIT 5`,
      [`%${keyword}%`, `%${keyword}%`]
    )
    results.push(...todos.map((t: any) => ({ type: 'todo', ...t })))
  }

  if (type === 'all' || type === 'countdown') {
    const countdowns = await query(
      `SELECT id, title, description, target_time FROM countdowns
       WHERE deleted = 0 AND (title LIKE ? OR description LIKE ?) LIMIT 5`,
      [`%${keyword}%`, `%${keyword}%`]
    )
    results.push(...countdowns.map((c: any) => ({ type: 'countdown', ...c })))
  }

  return {
    success: true,
    data: { results, count: results.length },
  }
}

async function updateItem(args: any): Promise<ToolExecutionResult> {
  const { type, id, updates } = args
  const tableMap: Record<string, string> = {
    sticky: 'sticky_notes',
    note: 'notepad',
    todo: 'todos',
    countdown: 'countdowns',
  }

  const table = tableMap[type]
  if (!table) return { success: false, error: '无效的类型' }

  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ')
  const values = Object.values(updates)

  await execute(
    `UPDATE ${table} SET ${fields}, updated_at = datetime('now') WHERE id = ?`,
    [...values, id]
  )

  return { success: true, data: { id, type, updated: updates } }
}

async function deleteItem(args: any): Promise<ToolExecutionResult> {
  const { type, id } = args
  const tableMap: Record<string, string> = {
    sticky: 'sticky_notes',
    note: 'notepad',
    todo: 'todos',
    countdown: 'countdowns',
  }

  const table = tableMap[type]
  if (!table) return { success: false, error: '无效的类型' }

  await execute(
    `UPDATE ${table} SET deleted = 1, deleted_at = datetime('now') WHERE id = ?`,
    [id]
  )

  return { success: true, data: { id, type } }
}
