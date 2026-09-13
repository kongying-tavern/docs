import { withBase } from 'vitepress'

/**
 * 字体 @font-face 样式表（字体管线生成到 public/fonts/，url 为相对路径）不进阻塞 CSS：
 * 生产由 head.ts 注入 preload + media="print" 链接，此处仅服务 dev
 */
export function loadFontStylesheets(): void {
  if (!import.meta.env.DEV)
    return

  for (const href of ['/fonts/fonts-subset.css', '/fonts/fonts-standard.css']) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = withBase(href)
    link.media = 'print'
    link.addEventListener('load', () => {
      link.media = 'all'
    })
    document.head.appendChild(link)
  }
}
