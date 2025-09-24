import type { JSONContent } from '@tiptap/core'

/**
 * 将TipTap JSON内容转换为纯文本，保留换行符
 */
export function tiptapJsonToText(json: JSONContent): string {
  if (!json || typeof json !== 'object') {
    return ''
  }

  // 如果是文本节点，直接返回文本
  if (json.type === 'text') {
    return json.text || ''
  }

  // 如果是段落，处理其内容并在末尾添加换行符
  if (json.type === 'paragraph') {
    const content = json.content ? json.content.map(tiptapJsonToText).join('') : ''
    return `${content}\n`
  }

  // 如果是硬换行
  if (json.type === 'hardBreak') {
    return '\n'
  }

  // 如果是emoji节点
  if (json.type === 'emoji') {
    return json.attrs?.emoji || ''
  }

  // 如果是mention节点
  if (json.type === 'mention') {
    return `@${json.attrs?.label || ''}`
  }

  // 如果是文档或其他容器节点，递归处理子内容
  if (json.content && Array.isArray(json.content)) {
    return json.content.map(tiptapJsonToText).join('')
  }

  return ''
}

/**
 * 尝试解析JSON内容，如果失败则返回原始文本（兼容历史数据）
 */
export function parseContentText(text: string): string {
  try {
    const jsonContent = JSON.parse(text)
    // 保留换行符，只移除过多的末尾空行（保留段落间的双换行符）
    const result = tiptapJsonToText(jsonContent)
    // 移除3个或更多连续的末尾换行符，保留最多2个（段落分隔）
    return result.replace(/\n{3,}$/, '\n\n')
  }
  catch {
    // 如果解析失败，说明是纯文本，直接返回
    return text
  }
}
