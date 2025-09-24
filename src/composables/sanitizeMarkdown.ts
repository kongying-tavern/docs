import { parseContentText } from './tiptapJsonToText'

export function sanitizeMarkdown(markdown: string | null | undefined): string {
  if (!markdown)
    return ''

  // 解析TipTap富文本JSON格式，兼容历史纯文本数据
  const text = parseContentText(markdown)

  return text
    // 删除图片（修正属性匹配，避免误匹配其他标签）
    .replace(/!\[([^\]]*)\]\(([^)]+)\)(\{[^}]*\})?/g, '')
    // 删除HTML注释（支持跨行）
    .replace(/<!--.*?-->/gs, '')
    // 删除自定义定义标签，但保留其中内容
    .replace(/\{define:[^}]*\}(.*?)\{\/define\}/gis, '$1')
    // 删除颜色标签并保留其中内容（保持原有换行符）
    .replace(/\{color:[^}]*\}(.*?)\{\/color\}/gis, '$1')
}
