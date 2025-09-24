/**
 * TipTap 扩展共用工具函数
 */

/**
 * 计算隐藏内容的最佳宽度
 * 复用自 .vitepress/theme/markdown/spoiler.ts
 */
export function calculateWidth(content: string): number {
  // 计算中文字符（更宽）和其他字符
  const chineseChars = (content.match(/[\u4E00-\u9FA5]/g) || []).length
  const otherChars = content.length - chineseChars

  // 更精确的字符宽度计算
  const estimatedWidth = (chineseChars * 16) + (otherChars * 9)

  // 自适应边界
  const minWidth = Math.max(60, content.length * 6) // 自适应最小值
  const maxWidth = 500 // 增加最大值以适应更长内容
  const padding = 30 // 减少内边距以更好地适应文本

  return Math.max(minWidth, Math.min(estimatedWidth + padding, maxWidth))
}

/**
 * 从内容中提取属性
 * 解析类似 "文本{width=200,align=center}" 或 "文本{w=150px,a=right}" 的格式
 */
export interface ExtractedAttributes {
  content: string
  width?: number
  align?: 'left' | 'center' | 'right'
}

export function extractAttributesFromContent(content: string): ExtractedAttributes {
  // 匹配模式: text{width=200,align=center} 或 text{w=150,a=right}
  const match = content.match(/^([^{]*)\{([^}]+)\}$/)
  if (!match)
    return { content }

  const cleanContent = match[1].trim()
  const attributesStr = match[2]
  const result: ExtractedAttributes = { content: cleanContent }

  // 解析多个属性
  const attributes = attributesStr.split(',').map(attr => attr.trim())

  for (const attr of attributes) {
    const [key, value] = attr.split('=').map(s => s.trim())

    if (key === 'width' || key === 'w') {
      const width = Number.parseInt(value.replace('px', ''))
      if (width >= 50 && width <= 800) {
        result.width = width
      }
    }

    if (key === 'align' || key === 'a') {
      if (['left', 'center', 'right'].includes(value)) {
        result.align = value as 'left' | 'center' | 'right'
      }
    }
  }

  return result
}
