import { parseContentText } from './tiptapJsonToText'

/** Matches Markdown image syntax with optional metadata */
const MARKDOWN_IMAGE_SANITIZE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g

/** Matches HTML comments */
const HTML_COMMENT_SANITIZE_REGEX = /<!--.*?-->/gs

/** Matches custom define tags */
const DEFINE_TAG_REGEX = /\{define:[^}]*\}(.*?)\{\/define\}/gis

/** Matches color tags */
const COLOR_TAG_REGEX = /\{color:[^}]*\}(.*?)\{\/color\}/gis

export function sanitizeMarkdown(markdown: string | null | undefined): string {
  if (!markdown)
    return ''

  // 解析TipTap富文本JSON格式，兼容历史纯文本数据
  const text = parseContentText(markdown)

  return text
    // 删除图片（修正属性匹配，避免误匹配其他标签）
    .replace(MARKDOWN_IMAGE_SANITIZE_REGEX, '')
    // 删除HTML注释（支持跨行）
    .replace(HTML_COMMENT_SANITIZE_REGEX, '')
    // 删除自定义定义标签，但保留其中内容
    .replace(DEFINE_TAG_REGEX, '$1')
    // 删除颜色标签并保留其中内容（保持原有换行符）
    .replace(COLOR_TAG_REGEX, '$1')
}
