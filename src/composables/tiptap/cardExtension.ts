import { Extension, mergeAttributes, Node } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'

export interface CardOptions {
  title: string
  desc?: string
  logo?: string
  link?: string
  color?: string
  cover?: string
  theme?: 'medium' | 'normal'
  hoverShadow?: boolean
  shadow?: boolean
}

const CARD_PROPS = [
  'title',
  'desc',
  'logo',
  'link',
  'color',
  'cover',
  'hoverShadow',
  'shadow',
  'theme',
]

/**
 * 卡片节点
 * 语法: ```card
 * title: 标题
 * desc: 描述
 * logo: 图标
 * link: 链接
 * ```
 */
export const CardNode = Node.create({
  name: 'card',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      config: {
        default: '{}',
        parseHTML: element => element.getAttribute('data-config'),
        renderHTML: (attributes) => {
          if (!attributes.config) {
            return {}
          }
          return {
            'data-config': attributes.config,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-card]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const config = HTMLAttributes.config || '{}'
    let cardData: CardOptions

    try {
      cardData = JSON.parse(config)
    }
    catch {
      cardData = { title: '无效的卡片配置' }
    }

    // 验证和过滤属性
    const validData: Partial<CardOptions> = {}
    for (const [key, value] of Object.entries(cardData)) {
      if (CARD_PROPS.includes(key) && typeof value === 'string') {
        if (key === 'title')
          validData.title = value
        if (key === 'desc')
          validData.desc = value
        if (key === 'logo')
          validData.logo = value
        if (key === 'link')
          validData.link = value
        if (key === 'color')
          validData.color = value
        if (key === 'cover')
          validData.cover = value
        if (key === 'theme')
          validData.theme = value as 'medium' | 'normal'
        if (key === 'hoverShadow')
          validData.hoverShadow = value === 'true'
        if (key === 'shadow')
          validData.shadow = value === 'true'
      }
    }

    if (!validData.title) {
      validData.title = '未命名卡片'
    }

    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-card': '',
      'data-config': JSON.stringify(validData),
      'class': 'card-preview border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm',
    }), [
      ['div', { class: 'card-title font-semibold text-lg mb-2' }, validData.title],
      validData.desc ? ['div', { class: 'card-desc text-gray-600 dark:text-gray-300 text-sm' }, validData.desc] : '',
    ]]
  },

})

/**
 * 卡片解析插件
 * 自动识别并转换 ```card 语法
 */
export const CardExtension = Extension.create({
  name: 'card',

  addExtensions() {
    return [
      CardNode,
    ]
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('cardParser'),
        props: {
          handleTextInput(view, from, to, text) {
            const { state, dispatch } = view
            const { doc } = state

            // 检查是否输入了完整的card代码块
            if (text !== '`')
              return false

            // 获取当前输入位置前的文本
            const beforeText = doc.textBetween(Math.max(0, from - 500), from)
            const fullText = beforeText + text

            // 匹配card代码块: ```card\n配置内容\n```
            const cardMatch = fullText.match(/```card\s*\n([^]*?)\n```$/)
            if (cardMatch) {
              const [fullMatch, configContent] = cardMatch
              const start = from - (fullMatch.length - text.length)

              if (start >= 0 && state.schema.nodes.card) {
                let cardConfig: CardOptions

                try {
                  // 尝试解析YAML格式的配置
                  const lines = configContent.trim().split('\n')
                  const config: any = {}

                  for (const line of lines) {
                    const [key, ...valueParts] = line.split(':')
                    if (key && valueParts.length > 0) {
                      const value = valueParts.join(':').trim()
                      const cleanKey = key.trim()
                      if (CARD_PROPS.includes(cleanKey)) {
                        config[cleanKey] = value
                      }
                    }
                  }

                  cardConfig = config as CardOptions
                  if (!cardConfig.title) {
                    cardConfig.title = '未命名卡片'
                  }
                }
                catch {
                  cardConfig = { title: '配置解析失败' }
                }

                const tr = state.tr.replaceWith(
                  start,
                  to,
                  state.schema.nodes.card.create({ config: JSON.stringify(cardConfig) }),
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

export default CardExtension
