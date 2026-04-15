import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

export async function openStickyFloat(noteId: number, options?: {
  x?: number
  y?: number
  width?: number
  height?: number
  color?: string
}) {
  const label = `sticky-${noteId}`

  // 如果窗口已存在，聚焦它
  const existing = await WebviewWindow.getByLabel(label)
  if (existing) {
    await existing.show()
    await existing.setFocus()
    return
  }

  const w = options?.width || 260
  const h = options?.height || 280

  const win = new WebviewWindow(label, {
    url: `/sticky-float?id=${noteId}`,
    title: '便签',
    width: w,
    height: h,
    x: options?.x ?? undefined,
    y: options?.y ?? undefined,
    decorations: false,
    transparent: true,
    alwaysOnTop: false,
    resizable: true,
    minWidth: 180,
    minHeight: 150,
    skipTaskbar: true,
  })

  win.once('tauri://error', (e) => {
    console.error('Failed to open sticky window:', e)
  })
}
