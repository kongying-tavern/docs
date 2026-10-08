import type { PluginSimple } from 'markdown-it'
import type MarkdownIt from 'markdown-it'
import EmojiData from '../../../src/_data/emojis.json' with { type: 'json' }

const emojiCache = new Map<string, { url: string, height: number, width: number }>()

function initEmojiCache() {
  if (emojiCache.size > 0)
    return

  EmojiData.forEach((preset) => {
    preset.list.forEach((item) => {
      const [_key, value] = Object.entries(item)[0]
      emojiCache.set(value, {
        url: value,
        height: preset.height,
        width: preset.width,
      })
    })
  })
}

const EMOJI_PATH_REGEX: RegExp = /^:(\d+\.[\u4E00-\u9FA5\w]+\/[\u4E00-\u9FA5\w-]+\.(?:png|gif|webp)):/

const MarkdownItEmoji: PluginSimple = (md: MarkdownIt) => {
  initEmojiCache()

  // 匹配 :数字.中文或英文/中文或英文-中文或英文.png: 格式
  const EMOJI_REGEX: RegExp = EMOJI_PATH_REGEX
  md.inline.ruler.before('entity', 'customEmoji', (state, silent) => {
    const pos = state.pos
    const ch = state.src.charCodeAt(pos)

    if (ch !== 0x3A)
      return false

    const match = EMOJI_REGEX.exec(state.src.slice(pos))
    if (!match)
      return false

    const fullMatch = match[0]
    const emojiPath = match[1]

    const emojiData = emojiCache.get(emojiPath)
    if (!emojiData) {
      // Debug only - skip unknown emojis silently
      return false
    }

    if (silent) {
      state.pos += fullMatch.length
      return true
    }

    const token = state.push('customEmoji', 'Emoji', 0)
    token.attrs = [
      ['emoji', emojiData.url],
      ['height', emojiData.height.toString()],
      ['width', emojiData.width.toString()],
    ]

    state.pos += fullMatch.length
    return true
  })

  md.renderer.rules.customEmoji = (tokens, idx) => {
    const token = tokens[idx]
    const emoji = token.attrs?.find(attr => attr[0] === 'emoji')?.[1] || ''
    const height = token.attrs?.find(attr => attr[0] === 'height')?.[1] || '20'
    const width = token.attrs?.find(attr => attr[0] === 'width')?.[1] || '20'
    return `<Emoji emoji="${emoji}" :height="${height}" :width="${width}" />`
  }
}

export default MarkdownItEmoji
