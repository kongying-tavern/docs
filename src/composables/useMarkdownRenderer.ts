import MarkdownIt from 'markdown-it'
import { ref } from 'vue'
import { markdownConfig } from '../../.vitepress/config/markdown'
import { sanitizeMarkdown } from './sanitizeMarkdown'

// 使用项目的markdown配置创建渲染器实例
function createProjectMarkdownRenderer() {
  // 创建新的MarkdownIt实例
  const md = new MarkdownIt({
    html: true, // 允许HTML内容
    breaks: true,
    linkify: true,
    typographer: true,
  })

  // 应用项目的markdown配置（但跳过可能不安全的插件）
  if (markdownConfig.config) {
    try {
      markdownConfig.config(md)
    }
    catch (error) {
      console.warn('应用markdown配置时出错，使用默认配置:', error)
    }
  }

  return md
}

// 全局markdown渲染器实例
let projectMarkdownRenderer: MarkdownIt | null = null

export function useMarkdownRenderer() {
  // 懒加载渲染器
  if (!projectMarkdownRenderer) {
    projectMarkdownRenderer = createProjectMarkdownRenderer()
  }

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // 渲染markdown文本（用于预览）
  const renderMarkdownPreview = (content: string, maxLength = 300): string => {
    if (!content)
      return ''

    try {
      isLoading.value = true
      error.value = null

      // 先清理和截断内容
      const sanitized = sanitizeMarkdown(content)
      const truncated = sanitized.length > maxLength
        ? `${sanitized.substring(0, maxLength)}...`
        : sanitized

      // 渲染markdown
      const rendered = projectMarkdownRenderer!.render(truncated)

      return rendered
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '渲染失败'
      console.error('Markdown渲染失败:', err)
      // 降级处理：返回纯文本
      const sanitized = sanitizeMarkdown(content)
      return sanitized.length > maxLength
        ? `${sanitized.substring(0, maxLength)}...`
        : sanitized
    }
    finally {
      isLoading.value = false
    }
  }

  // 完整渲染markdown（用于博客预览）
  const renderMarkdownFull = (content: string): string => {
    if (!content)
      return ''

    try {
      isLoading.value = true
      error.value = null

      // 渲染完整的markdown内容，不截断
      const rendered = projectMarkdownRenderer!.render(content)
      return rendered
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '渲染失败'
      console.error('Markdown渲染失败:', err)
      // 降级处理：返回纯文本
      return sanitizeMarkdown(content)
    }
    finally {
      isLoading.value = false
    }
  }

  // 获取渲染器实例
  const getRenderer = () => projectMarkdownRenderer

  return {
    renderMarkdownPreview,
    renderMarkdownFull,
    getRenderer,
    isLoading,
    error,
  }
}
