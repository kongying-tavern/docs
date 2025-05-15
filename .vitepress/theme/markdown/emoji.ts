import type { PluginSimple } from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import EmojiData from '../../../src/_data/emojis.json'

// 创建 emoji 查找缓存
const emojiCache = new Map<string, { url: string, height: number, width: number }>()

// 初始化 emoji 缓存
function initEmojiCache() {
  if (emojiCache.size > 0)
    return

  EmojiData.forEach((preset) => {
    preset.list.forEach((item) => {
      const [_key, value] = Object.entries(item)[0]
      // 存储完整的 emoji 路径作为 key
      emojiCache.set(value, {
        url: value,
        height: preset.height,
        width: preset.width,
      })
    })
  })
}

const MarkdownItEmoji: PluginSimple = (md: MarkdownIt) => {
  // 初始化缓存
  initEmojiCache()

  // 匹配 emoji 的正则表达式
  // 匹配 :数字.中文或英文/中文或英文-中文或英文.png: 格式
  const emojiRegex = /:(\d+\.[\u4E00-\u9FA5\w]+\/[\u4E00-\u9FA5\w-]+\.(?:png|gif|webp)):/

  // 添加内联规则
  md.inline.ruler.push('customEmoji', (state, silent) => {
    const pos = state.pos
    const ch = state.src.charCodeAt(pos)

    // 如果不是冒号，直接返回
    if (ch !== 0x3A/* : */)
      return false

    const match = emojiRegex.exec(state.src.slice(pos))
    if (!match)
      return false

    const fullMatch = match[0]
    const emojiPath = match[1]

    // 检查是否在白名单中
    const emojiData = emojiCache.get(emojiPath)
    if (!emojiData) {
      console.log(`Emoji not found in cache: ${emojiPath}`)
      return false
    }

    if (silent) {
      state.pos += fullMatch.length
      return true
    }

    // 创建 token
    const token = state.push('customEmoji', 'Emoji', 0)
    token.attrs = [
      ['emoji', emojiData.url],
      ['height', emojiData.height.toString()],
      ['width', emojiData.width.toString()],
    ]

    // 更新位置
    state.pos += fullMatch.length
    return true
  })

  // 添加渲染规则
  md.renderer.rules.customEmoji = (tokens, idx) => {
    const token = tokens[idx]
    const emoji = token.attrs?.find(attr => attr[0] === 'emoji')?.[1] || ''
    const height = token.attrs?.find(attr => attr[0] === 'height')?.[1] || '20'
    const width = token.attrs?.find(attr => attr[0] === 'width')?.[1] || '20'
    return `<Emoji emoji="${emoji}" :height="${height}" :width="${width}" />`
  }
}

export default MarkdownItEmoji
