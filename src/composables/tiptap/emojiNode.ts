import type { EmojiAttrs } from '@/components/ui/Emoji.vue'
import EmojiWrapper from '@/components/ui/EmojiWrapper.vue'
import { InputRule, mergeAttributes, Node } from '@tiptap/core'
import { VueNodeViewRenderer } from '@tiptap/vue-3'

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
    return ['EmojiWrapper', mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return VueNodeViewRenderer(EmojiWrapper)
  },

  addInputRules() {
    return [
      new InputRule({
        find: /:(\d+\.[\u4E00-\u9FA5\w]+\/[\u4E00-\u9FA5\w-]+\.(?:png|gif|webp)):/g,
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
