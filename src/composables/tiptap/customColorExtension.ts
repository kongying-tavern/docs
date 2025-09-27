import { Extension, mergeAttributes, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * 自定义颜色节点
 * 语法: {color:颜色值}文字内容{/color}
 */
export const CustomColorNode = Node.create({
  name: 'customColor',

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
      color: {
        default: '',
        parseHTML: element => element.style.color || element.getAttribute('data-color'),
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {}
          }
          return {
            'style': `color: ${attributes.color}`,
            'data-color': attributes.color,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-color]',
      },
      {
        tag: 'span[style*="color"]',
        getAttrs: (element) => {
          const style = (element as HTMLElement).style.color
          return style ? { color: style } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const color = HTMLAttributes.color || HTMLAttributes['data-color']
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'style': `color: ${color}`,
      'data-color': color,
    }), 0]
  },

})

/**
 * 自定义颜色解析插件
 * 自动识别并转换 {color:} 语法
 */
export const CustomColorExtension = Extension.create({
  name: 'customColor',

  addExtensions() {
    return [
      CustomColorNode,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customColorParser'),
        props: {
          handleTextInput(view, from, to, text) {
            const { state, dispatch } = view
            const { doc } = state

            // 获取当前输入位置前的文本（限制长度避免性能问题）
            const beforeText = doc.textBetween(Math.max(0, from - 200), from)
            const fullText = beforeText + text

            // 自定义颜色语法: {color:颜色值}文字内容{/color}
            const colorMatch = fullText.match(/\{color:([^}]+)\}([^{]*)\{\/color\}$/)
            if (colorMatch) {
              const [fullMatch, color, content] = colorMatch
              const start = from - (fullMatch.length - text.length)

              if (start >= 0 && state.schema.nodes.customColor) {
                const tr = state.tr.replaceWith(
                  start,
                  to,
                  state.schema.nodes.customColor.create(
                    { color: color.trim() },
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

export default CustomColorExtension
