import { Extension, mergeAttributes, Node } from '@tiptap/core'

/**
 * 时间线节点
 * 语法: :::timeline 标题
 * 内容
 * :::
 */
export const TimelineNode = Node.create({
  name: 'timelineNode',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  content: 'text*',

  atom: true,

  addAttributes() {
    return {
      title: {
        default: '',
        parseHTML: element => element.getAttribute('data-title'),
        renderHTML: (attributes) => {
          if (!attributes.title) {
            return {}
          }
          return {
            'data-title': attributes.title,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-timeline]',
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    const title = HTMLAttributes.title || HTMLAttributes['data-title'] || ''
    const content = node.textContent || ''

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-timeline': '',
        'data-title': title,
        'class': 'timeline-source p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded font-mono text-sm',
      }),
      `:::timeline ${title}\n${content}\n:::`,
    ]
  },

  addPasteRules() {
    return [
      {
        find: /:::timeline\s+([^\n]+)\n([\s\S]*?)\n:::/g,
        handler: ({ match, commands, range }) => {
          const [, title, content] = match

          // 删除匹配的文本并替换为timeline节点
          const { from, to } = range
          commands.deleteRange({ from, to })
          commands.insertContent({
            type: this.name,
            attrs: { title: title.trim() },
            content: content.trim() ? [{ type: 'text', text: content.trim() }] : [],
          })
        },
      },
    ]
  },

})

/**
 * 时间线解析插件
 * 自动识别并转换 :::timeline 语法
 */
export const TimelineExtension = Extension.create({
  name: 'timeline',

  addExtensions() {
    return [
      TimelineNode,
    ]
  },
})

export default TimelineExtension
