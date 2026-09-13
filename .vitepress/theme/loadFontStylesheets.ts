/**
 * 字体 @font-face 声明（约 180KB）不参与首屏阻塞 CSS：
 * 由 main.css 拆出后经此动态导入，Vite 会将其生成为独立异步样式 chunk，
 * 在客户端启动时并行加载；font-display: swap 保证声明到达前以回退字体渲染
 */
export function loadFontStylesheets(): void {
  void Promise.all([
    import('./styles/fonts-subset.css'),
    import('./styles/fonts-standard.css'),
  ]).catch(() => undefined)
}
