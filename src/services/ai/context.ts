import { query } from '../db'

/**
 * 收集用户当前上下文信息，自动注入到 AI 对话
 */
export async function collectUserContext(): Promise<string> {
  const sections: string[] = []

  // 当前时间
  const now = new Date()
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
  const timeStr = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
  sections.push(`当前时间：${dateStr} ${timeStr}`)

  // 今日待办
  const todos = await query(
    `SELECT id, title, priority, completed FROM todos
     WHERE deleted = 0 AND (due_date IS NULL OR date(due_date) <= date('now'))
     ORDER BY
       CASE priority
         WHEN 'urgent' THEN 1
         WHEN 'important' THEN 2
         ELSE 3
       END,
       created_at DESC
     LIMIT 10`,
    []
  )

  if (todos.length > 0) {
    const todoList = todos.map((t: any) => {
      const status = t.completed ? '✓' : '○'
      const priority = t.priority === 'urgent' ? '[紧急]' : t.priority === 'important' ? '[重要]' : ''
      return `  ${status} ${priority} ${t.title}`
    }).join('\n')
    sections.push(`今日待办（${todos.length} 项）：\n${todoList}`)
  } else {
    sections.push('今日待办：无')
  }

  // 即将到期的倒计时（未来 7 天内）
  const countdowns = await query(
    `SELECT id, title, target_time FROM countdowns
     WHERE deleted = 0
       AND datetime(target_time) > datetime('now')
       AND datetime(target_time) <= datetime('now', '+7 days')
     ORDER BY target_time ASC
     LIMIT 5`,
    []
  )

  if (countdowns.length > 0) {
    const countdownList = countdowns.map((c: any) => {
      const targetDate = new Date(c.target_time)
      const timeStr = targetDate.toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      return `  • ${c.title} - ${timeStr}`
    }).join('\n')
    sections.push(`即将到期的提醒（${countdowns.length} 项）：\n${countdownList}`)
  }

  // 最近的便签（最多 3 条）
  const stickies = await query(
    `SELECT id, title, content FROM sticky_notes
     WHERE deleted = 0
     ORDER BY updated_at DESC
     LIMIT 3`,
    []
  )

  if (stickies.length > 0) {
    const stickyList = stickies.map((s: any) => {
      const title = s.title || '无标题'
      const preview = s.content.length > 30 ? s.content.slice(0, 30) + '...' : s.content
      return `  • ${title}: ${preview}`
    }).join('\n')
    sections.push(`最近的便签（${stickies.length} 条）：\n${stickyList}`)
  }

  // 今日习惯打卡
  const today = now.toISOString().split('T')[0]
  const habits = await query(
    `SELECT h.id, h.name, h.icon,
       (SELECT COUNT(*) FROM habit_records WHERE habit_id = h.id AND checked_date = ?) as checked
     FROM habits h
     WHERE h.deleted = 0
     ORDER BY h.created_at DESC
     LIMIT 5`,
    [today]
  )

  if (habits.length > 0) {
    const habitList = habits.map((h: any) => {
      const status = h.checked > 0 ? '✓' : '○'
      return `  ${status} ${h.icon} ${h.name}`
    }).join('\n')
    sections.push(`今日习惯（${habits.length} 项）：\n${habitList}`)
  }

  return sections.join('\n\n')
}

/**
 * 生成系统提示词
 */
export function getSystemPrompt(): string {
  return `你是浮墨，一个桌面上的生活管家 AI 助手。你的职责是帮助用户管理日常生活中的待办、提醒、便签、笔记和习惯。

## 你的能力

你可以通过工具调用来帮助用户：
- 创建待办事项（create_todo）
- 创建倒计时提醒（create_countdown）
- 创建便签（create_sticky）
- 创建笔记（create_note）
- 搜索已有内容（search）
- 更新或删除项目（update_item, delete_item）

## 交互原则

1. **主动识别意图**：用户说"明天 8 点提醒我吃药"，你应该直接调用 create_countdown 工具，而不是只回复"好的我记下了"
2. **简洁友好**：回复简短、口语化，像朋友聊天一样
3. **看得见的反馈**：每次操作后明确告诉用户做了什么
4. **普通人语言**：不使用技术术语，错误信息要通俗易懂
5. **时间智能**：理解"明天"、"下周三"、"3 天后"等自然语言时间表达

## 示例对话

用户："明天 8 点提醒我吃药"
你：[调用 create_countdown] 好的，明天早上 8:00 我会提醒你吃药 ✓

用户："今天要做什么？"
你：[查看上下文中的待办] 今天你有 3 件事：1. [紧急] 交报告 2. 买菜 3. 健身

用户："记一下：周末去超市买牛奶"
你：[调用 create_sticky] 已经帮你记在便签上了 ✓`
}
