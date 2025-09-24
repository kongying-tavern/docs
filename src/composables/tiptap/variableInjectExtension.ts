import { Extension, mergeAttributes, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

/**
 * 变量定义节点
 * 语法: {define:变量名}内容{/define}
 */
export const VariableDefineNode = Node.create({
  name: 'variableDefine',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'text*',

  addAttributes() {
    return {
      variableName: {
        default: '',
        parseHTML: element => element.getAttribute('data-variable-name'),
        renderHTML: (attributes) => {
          if (!attributes.variableName) {
            return {}
          }
          return {
            'data-variable-name': attributes.variableName,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-variable-define]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const variableName = HTMLAttributes.variableName || HTMLAttributes['data-variable-name']
    const content = node.textContent

    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-variable-define': '',
      'data-variable-name': variableName,
      'class': 'variable-define bg-gray-100 dark:bg-gray-800 p-2 rounded border-l-4 border-blue-500',
    }), [
      ['span', { class: 'text-sm text-gray-600 dark:text-gray-400' }, `{define:${variableName}}`],
      ['span', { class: 'mx-2' }, content],
      ['span', { class: 'text-sm text-gray-600 dark:text-gray-400' }, '{/define}'],
    ]]
  },

})

/**
 * 变量调用节点
 * 语法: {%=变量名%}
 */
export const VariableCallNode = Node.create({
  name: 'variableCall',

  group: 'inline',

  inline: true,

  addAttributes() {
    return {
      variableName: {
        default: '',
        parseHTML: element => element.getAttribute('data-variable-name'),
        renderHTML: (attributes) => {
          if (!attributes.variableName) {
            return {}
          }
          return {
            'data-variable-name': attributes.variableName,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-call]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const variableName = HTMLAttributes['data-variable-name'] || HTMLAttributes.variableName
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-variable-call': '',
      'class': 'variable-call bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-sm font-mono',
    }), `{%=${variableName}%}`]
  },

})

/**
 * 变量注入解析插件
 * 自动识别并转换 {define:} 和 {%=} 语法
 */
export const VariableInjectExtension = Extension.create({
  name: 'variableInject',

  addExtensions() {
    return [
      VariableDefineNode,
      VariableCallNode,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('variableInjectParser'),
        props: {
          handleTextInput(view, from, to, text) {
            const { state, dispatch } = view
            const { doc } = state

            // 获取当前输入位置前的文本（限制长度避免性能问题）
            const beforeText = doc.textBetween(Math.max(0, from - 100), from)
            const fullText = beforeText + text

            // 变量定义语法: {define:变量名}内容{/define}
            const defineMatch = fullText.match(/\{define:\s*(\w+)\s*\}([^{]*)\{\/define\}$/)
            if (defineMatch) {
              const [fullMatch, variableName, content] = defineMatch
              const start = from - (fullMatch.length - text.length)

              if (start >= 0 && state.schema.nodes.variableDefine) {
                const tr = state.tr.replaceWith(
                  start,
                  to,
                  state.schema.nodes.variableDefine.create(
                    { variableName: variableName.trim() },
                    content.trim() ? state.schema.text(content.trim()) : undefined,
                  ),
                )
                dispatch(tr)
                return true
              }
            }

            // 变量调用语法: {%=变量名%}
            const callMatch = fullText.match(/\{%=\s*(\w+)\s*%\}$/)
            if (callMatch) {
              const [fullMatch, variableName] = callMatch
              const start = from - (fullMatch.length - text.length)

              if (start >= 0 && state.schema.nodes.variableCall) {
                const tr = state.tr.replaceWith(
                  start,
                  to,
                  state.schema.nodes.variableCall.create({ variableName: variableName.trim() }),
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

export default VariableInjectExtension
