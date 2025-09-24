import type { QQAutoLinkConfig } from './qqLinkConfig'
import { Extension, Mark, markInputRule, markPasteRule, mergeAttributes } from '@tiptap/core'
import { defaultQQAutoLinkConfig, mergeQQAutoLinkConfig } from './qqLinkConfig'

// QQ号链接标记扩展
export const QQLinkMark = Mark.create({
  name: 'qqLink',

  // 不能跨越多行
  spanning: false,

  // 添加属性
  addAttributes() {
    return {
      qq: {
        default: null,
        parseHTML: element => element.getAttribute('data-qq'),
        renderHTML: (attributes) => {
          if (!attributes.qq) {
            return {}
          }
          return {
            'data-qq': attributes.qq,
          }
        },
      },
      href: {
        default: null,
        parseHTML: element => element.getAttribute('href'),
        renderHTML: (attributes) => {
          if (!attributes.href) {
            return {}
          }
          return {
            href: attributes.href,
          }
        },
      },
    }
  },

  // 解析HTML规则
  parseHTML() {
    return [
      {
        tag: 'a[data-qq]',
        getAttrs: (element) => {
          const qq = (element as HTMLElement).getAttribute('data-qq')
          const href = (element as HTMLElement).getAttribute('href')
          return qq && href ? { qq, href } : false
        },
      },
    ]
  },

  // 渲染HTML
  renderHTML({ HTMLAttributes }) {
    return [
      'a',
      mergeAttributes(
        {
          class: 'qq-link vp-link',
          target: '_blank',
          rel: 'noopener noreferrer',
          title: `联系QQ：${HTMLAttributes['data-qq']}`,
        },
        HTMLAttributes,
      ),
      0,
    ]
  },

  // 添加输入规则（实时输入识别）
  addInputRules() {
    const qqPattern = /QQ( )?([1-9]\d{4,10})$/

    return [
      markInputRule({
        find: qqPattern,
        type: this.type,
        getAttributes: (match) => {
          const qqNumber = match[2] // QQ号码部分

          return {
            qq: qqNumber,
            href: `https://wpa.qq.com/msgrd?v=3&uin=${qqNumber}&site=qq&menu=yes`,
          }
        },
      }),
    ]
  },

  // 添加粘贴规则（粘贴时识别）
  addPasteRules() {
    const qqPattern = /QQ( )?([1-9]\d{4,10})/g

    return [
      markPasteRule({
        find: qqPattern,
        type: this.type,
        getAttributes: (match) => {
          const qqNumber = match[2] // QQ号码部分

          return {
            qq: qqNumber,
            href: `https://wpa.qq.com/msgrd?v=3&uin=${qqNumber}&site=qq&menu=yes`,
          }
        },
      }),
    ]
  },

  // 添加命令
  addCommands() {
    return {
      setQQLink: (options: { qq: string }) => ({ commands }) => {
        return commands.setMark(this.name, {
          qq: options.qq,
          href: `https://wpa.qq.com/msgrd?v=3&uin=${options.qq}&site=qq&menu=yes`,
        })
      },
      toggleQQLink: (options: { qq: string }) => ({ commands }) => {
        return commands.toggleMark(this.name, {
          qq: options.qq,
          href: `https://wpa.qq.com/msgrd?v=3&uin=${options.qq}&site=qq&menu=yes`,
        })
      },
      unsetQQLink: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})

// QQ号自动链接扩展
export const QQAutoLinkExtension = Extension.create<QQAutoLinkConfig>({
  name: 'qqAutoLink',

  // 添加依赖的标记
  addExtensions() {
    return [QQLinkMark]
  },

  // 添加全局属性
  addGlobalAttributes() {
    const config = mergeQQAutoLinkConfig(this.options)

    return [
      {
        types: ['qqLink'],
        attributes: {
          class: {
            default: config.className,
            rendered: false,
          },
        },
      },
    ]
  },

  // 添加配置选项
  addOptions() {
    return defaultQQAutoLinkConfig
  },
})

// 导出默认配置的扩展
export const QQAutoLink = QQAutoLinkExtension.configure({
  enabled: true,
})

// 类型声明
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    qqLink: {
      /**
       * 设置QQ链接标记
       */
      setQQLink: (options: { qq: string }) => ReturnType
      /**
       * 切换QQ链接标记
       */
      toggleQQLink: (options: { qq: string }) => ReturnType
      /**
       * 取消QQ链接标记
       */
      unsetQQLink: () => ReturnType
    }
  }
}
