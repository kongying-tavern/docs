import { withBase } from 'vitepress'

/**
 * 字体 @font-face 声明（约 180KB）不参与首屏阻塞 CSS：
 * 两个样式表由字体管线生成到 public/fonts/（与 woff2 分块同目录，url 使用相对路径以适配任意 base）。
 * 生产环境由 head.ts 以 preload + media="print" 静态注入；
 * 此处仅服务开发环境（dev 无 isProd 的 head 注入，用运行时链接走本地 public 资源）
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
