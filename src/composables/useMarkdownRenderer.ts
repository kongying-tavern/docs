import MarkdownIt from 'markdown-it'
import { ref } from 'vue'
import { stripMarkdownImages } from '~/services/forum/forumContentCodec'
import { markdownConfig } from '../../.vitepress/config/markdown'

/** Matches HTML comments in trusted repository-authored Markdown previews. */
const HTML_COMMENT_REGEX = /<!--[\s\S]*?(?:-->|--!>|$)/g

/** Matches legacy define tags while retaining their inner text. */
const DEFINE_TAG_REGEX = /\{define:[^}]*\}(.*?)\{\/define\}/gis

/** Matches legacy color tags while retaining their inner text. */
const COLOR_TAG_REGEX = /\{color:[^}]*\}(.*?)\{\/color\}/gis

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
      // VitePress 2.0 passes MarkdownItAsync, but standalone MarkdownIt is
      // structurally compatible for our plugins (timeline, comark-patches)
      ;(markdownConfig.config as (md: MarkdownIt) => void)(md)
    }
    catch {
      // 应用markdown配置时出错，使用默认配置
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

      const preview = stripPreviewDecorators(content)
      const truncated = preview.length > maxLength
        ? `${preview.substring(0, maxLength)}...`
        : preview

      // 渲染markdown
      const rendered = projectMarkdownRenderer!.render(truncated)

      return rendered
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : '渲染失败'
      // 降级处理：返回纯文本
      const preview = stripPreviewDecorators(content)
      return preview.length > maxLength
        ? `${preview.substring(0, maxLength)}...`
        : preview
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
      // 降级处理：返回纯文本
      return stripPreviewDecorators(content)
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

function stripPreviewDecorators(markdown: string): string {
  return stripMarkdownImages(markdown)
    .replace(HTML_COMMENT_REGEX, '')
    .replace(DEFINE_TAG_REGEX, '$1')
    .replace(COLOR_TAG_REGEX, '$1')
}
