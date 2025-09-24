import { Extension, mergeAttributes, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { calculateWidth } from './utils'

/**
 * 隐藏内容节点
 * 语法: !!隐藏内容!! 或 !!隐藏内容!!{width=200,align=center}
 */
export const SpoilerNode = Node.create({
  name: 'spoiler',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'inline',

  inline: true,

  content: 'text*',

  addAttributes() {
    return {
      width: {
        default: null,
        parseHTML: (element) => {
          const width = element.getAttribute('data-width')
          return width ? Number.parseInt(width) : null
        },
        renderHTML: (attributes) => {
          if (!attributes.width) {
            return {}
          }
          return {
            'data-width': attributes.width,
          }
        },
      },
      align: {
        default: null,
        parseHTML: element => element.getAttribute('data-align'),
        renderHTML: (attributes) => {
          if (!attributes.align) {
            return {}
          }
          return {
            'data-align': attributes.align,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-spoiler]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const content = node.textContent || ''
    const width = HTMLAttributes.width || calculateWidth(content)
    const align = HTMLAttributes.align

    const attrs: Record<string, string | number> = {
      'data-spoiler': '',
      'data-width': width,
      'class': 'spoiler-content inline-spoiler bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded cursor-pointer select-none',
    }

    if (align) {
      attrs['data-align'] = align
      attrs.style = `text-align: ${align};`
    }

    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, attrs), 0]
  },

})

/**
 * 隐藏内容解析插件
 * 自动识别并转换 !!content!! 语法
 */
export const SpoilerExtension = Extension.create({
  name: 'spoiler',

  addExtensions() {
    return [
      SpoilerNode,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('spoilerParser'),
        props: {
          handleTextInput(view, from, to, text) {
            const { state, dispatch } = view
            const { doc } = state

            // 获取当前输入位置前的文本（限制长度避免性能问题）
            const beforeText = doc.textBetween(Math.max(0, from - 200), from)
            const fullText = beforeText + text

            // 隐藏内容语法: !!content!! 或 !!content!!{width=200,align=center}
            const spoilerMatch = fullText.match(/!!(.*?)!!\{?([^}]*)\}?$/)
            if (spoilerMatch) {
              const [fullMatch, content, attributesStr] = spoilerMatch
              const start = from - (fullMatch.length - text.length)

              if (start >= 0 && state.schema.nodes.spoiler) {
                // 解析属性
                const attrs: { width?: number, align?: string } = {}

                if (attributesStr) {
                  const attributes = attributesStr.split(',').map(attr => attr.trim())
                  for (const attr of attributes) {
                    const [key, value] = attr.split('=').map(s => s.trim())

                    if ((key === 'width' || key === 'w') && value) {
                      const width = Number.parseInt(value.replace('px', ''))
                      if (width >= 50 && width <= 800) {
                        attrs.width = width
                      }
                    }

                    if ((key === 'align' || key === 'a') && value) {
                      if (['left', 'center', 'right'].includes(value)) {
                        attrs.align = value
                      }
                    }
                  }
                }

                const tr = state.tr.replaceWith(
                  start,
                  to,
                  state.schema.nodes.spoiler.create(
                    attrs,
                    content.trim() ? state.schema.text(content.trim()) : undefined,
                  ),
                )
                dispatch(tr)
                return true
              }
            }

            return false
          },
        },
      }),
    ]
  },
})

export default SpoilerExtension
