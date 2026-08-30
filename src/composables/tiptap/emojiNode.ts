import type { EmojiAttrs } from '@/components/ui/types'
import { InputRule, mergeAttributes, Node } from '@tiptap/core'

/** Matches emoji syntax in text */
const EMOJI_SYNTAX_REGEX = /:(\d+\.[\u4E00-\u9FA5\w]+\/[\u4E00-\u9FA5\w-]+\.(?:png|gif|webp)):/g

/** Matches an emoji filename extension. */
const EMOJI_FILE_EXTENSION_REGEX = /\.[^.]+$/

export const EmojiNode = Node.create({
  name: 'emoji',

  group: 'inline',

  inline: true,

  selectable: true,

  atom: true,

  draggable: true,

  addAttributes() {
    return {
      emoji: {
        default: null,
      },
      height: {
        default: '20px',
      },
      width: {
        default: '20px',
      },
    }
  },

  renderHTML({ HTMLAttributes }) {
    const emoji = String(HTMLAttributes.emoji || '')
    const base = typeof import.meta.env?.BASE_URL === 'string' ? import.meta.env.BASE_URL : '/'
    const src = `${base.endsWith('/') ? base : `${base}/`}emojis/${emoji.split('/').map(encodeURIComponent).join('/')}`
    const alt = emoji.split('/').at(-1)?.replace(EMOJI_FILE_EXTENSION_REGEX, '') || 'emoji'
    return ['img', mergeAttributes(HTMLAttributes, {
      'src': src,
      'alt': alt,
      'title': alt,
      'data-emoji': emoji,
    })]
  },

  addInputRules() {
    return [
      new InputRule({
        find: EMOJI_SYNTAX_REGEX,
        handler: ({ state, range, match }) => {
          const { tr } = state
          const emoji = match[1]

          if (!emoji)
            return null

          const attrs: EmojiAttrs = { emoji, width: 20, height: 20 }
          const node = this.type.create(attrs)

          if (range.from < 0 || range.to > state.doc.content.size) {
            return null
          }

          tr.replaceWith(range.from, range.to, node)

          return null
        },
      }),
    ]
  },
  renderText({ node }) {
    return `:${node.attrs.emoji}:`
  },
})
