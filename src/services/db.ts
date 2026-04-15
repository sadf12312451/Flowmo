import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:flowmo.db')
    await initTables()
  }
  return db
}

async function initTables() {
  if (!db) return

  // 便签表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sticky_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#fffae6',
      pinned INTEGER NOT NULL DEFAULT 0,
      opacity REAL NOT NULL DEFAULT 1.0,
      pos_x REAL DEFAULT NULL,
      pos_y REAL DEFAULT NULL,
      width REAL DEFAULT 260,
      height REAL DEFAULT 280,
      tags TEXT NOT NULL DEFAULT '[]',
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 记事本表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notepad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT '未命名笔记',
      content TEXT NOT NULL DEFAULT '',
      content_type TEXT NOT NULL DEFAULT 'richtext',
      tags TEXT NOT NULL DEFAULT '[]',
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 待办表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER DEFAULT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      completed INTEGER NOT NULL DEFAULT 0,
      priority INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      due_date TEXT DEFAULT NULL,
      repeat_type TEXT DEFAULT NULL,
      repeat_interval INTEGER DEFAULT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      completed_at TEXT DEFAULT NULL,
      FOREIGN KEY (parent_id) REFERENCES todos(id) ON DELETE CASCADE
    )
  `)

  // 倒计时表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS countdowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      target_time TEXT NOT NULL,
      remind_before INTEGER NOT NULL DEFAULT 0,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      sound_type TEXT NOT NULL DEFAULT 'default',
      color TEXT NOT NULL DEFAULT '#4098fc',
      tags TEXT NOT NULL DEFAULT '[]',
      completed INTEGER NOT NULL DEFAULT 0,
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 番茄钟记录表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS pomodoro_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duration INTEGER NOT NULL DEFAULT 1500,
      started_at TEXT NOT NULL,
      ended_at TEXT DEFAULT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT ''
    )
  `)

  // 习惯打卡表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '✓',
      color TEXT NOT NULL DEFAULT '#18a058',
      target_days TEXT NOT NULL DEFAULT '[]',
      deleted INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    )
  `)

  // 打卡记录表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      checked_date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, checked_date)
    )
  `)
}

// 通用查询
export async function query<T = Record<string, unknown>>(sql: string, bindValues?: unknown[]): Promise<T[]> {
  const database = await getDb()
  return database.select<T[]>(sql, bindValues)
}

// 通用执行
export async function execute(sql: string, bindValues?: unknown[]) {
  const database = await getDb()
  return database.execute(sql, bindValues)
}
