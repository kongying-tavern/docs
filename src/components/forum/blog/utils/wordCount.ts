import { parseContentText } from '~/composables/tiptapJsonToText'

/**
 * 计算文本的字数和字符数
 */
export function calculateWordCount(content: string): { words: number, characters: number } {
  if (!content) {
    return { words: 0, characters: 0 }
  }

  // 尝试解析TipTap JSON内容，如果失败则使用原始文本
  const plainText = parseContentText(content)

  // 计算字符数（不包括空白字符）
  const characters = plainText.replace(/\s/g, '').length

  // 计算单词数
  // 对于中文内容，每个字符算作一个词
  // 对于英文内容，按空白字符分割
  const trimmedText = plainText.trim()
  if (!trimmedText) {
    return { words: 0, characters: 0 }
  }

  // 检测是否主要是中文内容
  const chineseCharCount = (trimmedText.match(/[\u4E00-\u9FFF]/g) || []).length
  const totalCharCount = trimmedText.replace(/\s/g, '').length
  const isMainlyChinese = chineseCharCount / totalCharCount > 0.5

  let words: number
  if (isMainlyChinese) {
    // 中文模式：字符数等于词数
    words = totalCharCount
  }
  else {
    // 英文模式：按空白字符分割计算单词数
    words = trimmedText.split(/\s+/).filter(word => word.length > 0).length
  }

  return { words, characters }
}

/**
 * 格式化字数显示
 */
export function formatWordCount(content: string): string {
  const { words } = calculateWordCount(content)
  return `${words} 字`
}

/**
 * 格式化字符数显示
 */
export function formatCharacterCount(content: string): string {
  const { characters } = calculateWordCount(content)
  return `${characters} 字符`
}
