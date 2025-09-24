import type { ChainedCommands, Editor, Range } from '@tiptap/core'
import type { Mark } from '@tiptap/pm/model'
import Link from '@tiptap/extension-link'
import { convertSiteUrl, fetchPageTitle, generateTopicUrl, isSiteUrl, isValidTopicId, parseTopicId } from './siteUrlParser'

/**
 * 常见网站白名单
 */
const ALLOWED_DOMAINS = [
  // 社交媒体
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'weibo.com',
  'zhihu.com',

  // 视频平台
  'bilibili.com',
  'b23.tv',
  'vimeo.com',
  'twitch.tv',

  // 开发相关
  'github.com',
  'gitlab.com',
  'stackoverflow.com',
  'npmjs.com',
  'medium.com',
  'dev.to',
  'codepen.io',
  'codesandbox.io',
  'replit.com',

  // 文档和教程
  'wikipedia.org',
  'w3schools.com',
  'mdn.mozilla.org',
  'developer.mozilla.org',
  'vuejs.org',
  'reactjs.org',
  'angular.io',
  'nodejs.org',
  'typescript.org',

  // 新闻和资讯
  'news.ycombinator.com',
  'reddit.com',
  'techcrunch.com',
  'wired.com',
  'theverge.com',
  '36kr.com',
  'sspai.com',

  // 工具和服务
  'google.com',
  'bing.com',
  'baidu.com',
  'duckduckgo.com',
  'notion.so',
  'figma.com',
  'canva.com',
  'discord.com',
  'slack.com',
  'zoom.us',

  // 游戏相关
  'steam.com',
  'steamcommunity.com',
  'mihoyo.com',
  'hoyoverse.com',
  'yuanshen.com',
  'genshin.mihoyo.com',
  'webstatic.mihoyo.com',

  // 云服务
  'amazonaws.com',
  'cloudflare.com',
  'vercel.com',
  'netlify.com',
  'heroku.com',

  // 本地和开发环境
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
]

/**
 * 检查 URL 是否在白名单中
 */
export function isAllowedUri(uri: string): boolean {
  try {
    const url = new URL(uri)
    const hostname = url.hostname.toLowerCase()

    // 检查是否是 localhost 或 IP 地址
    if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return true
    }

    // 检查是否在白名单中（支持子域名）
    return ALLOWED_DOMAINS.some(domain =>
      hostname === domain || hostname.endsWith(`.${domain}`),
    )
  }
  catch {
    // 如果不是有效的 URL，允许相对链接
    return !uri.startsWith('http')
  }
}

/**
 * 默认 Link 扩展配置
 */
export const defaultLinkConfig = {
  openOnClick: true,
  linkOnPaste: true,
  autolink: true,
  inclusive: false, // 重要：防止在链接后输入时文字被包含在链接中
  HTMLAttributes: {
    class: 'vp-link',
    target: '_blank',
    rel: 'noopener noreferrer',
  },
  // 为本站链接添加特殊样式
  renderHTML({ HTMLAttributes, mark }: { HTMLAttributes: any, mark: any }) {
    const isSiteLink = mark.attrs['data-site-link'] === 'true'
    const siteClass = isSiteLink ? 'site-link' : ''

    return [
      'a',
      {
        ...HTMLAttributes,
        class: `vp-link ${siteClass}`.trim(),
      },
      0,
    ]
  },
  validate: isAllowedUri,
}

/**
 * 编辑器 Link 扩展配置（点击时不打开链接）
 */
export const editorLinkConfig = {
  ...defaultLinkConfig,
  openOnClick: false,
}

/**
 * 只读内容 Link 扩展配置（允许点击打开）
 */
export const readOnlyLinkConfig = {
  ...defaultLinkConfig,
  openOnClick: true,
}

/**
 * 创建配置好的 Link 扩展
 */
export function createLinkExtension(options: {
  openOnClick?: boolean
  editable?: boolean
} = {}) {
  const { openOnClick = false, editable = true } = options

  const config = editable ? editorLinkConfig : readOnlyLinkConfig

  return Link.extend({
    inclusive: false, // 确保链接不会无限扩展

    addKeyboardShortcuts() {
      return {
        // 在链接末尾按空格键时，停止链接模式
        Space: ({ editor }: { editor: Editor }) => {
          const { selection } = editor.state
          const { $from } = selection

          // 检查当前是否在链接内
          const linkMark = $from.marks().find((mark: Mark) => mark.type.name === 'link')
          if (linkMark) {
            // 移除链接标记，让后续输入不再是链接的一部分
            editor.commands.unsetMark('link')
          }

          return false // 让空格正常插入
        },

        // 在链接末尾按 Enter 键时，停止链接模式
        Enter: ({ editor }: { editor: Editor }) => {
          const { selection } = editor.state
          const { $from } = selection

          const linkMark = $from.marks().find((mark: Mark) => mark.type.name === 'link')
          if (linkMark) {
            editor.commands.unsetMark('link')
          }

          return false // 让 Enter 正常换行
        },

        // 右箭头键移出链接边界时，停止链接模式
        ArrowRight: ({ editor }: { editor: Editor }) => {
          const { selection } = editor.state
          const { $from } = selection

          if (selection.empty) {
            const linkMark = $from.marks().find((mark: Mark) => mark.type.name === 'link')
            if (linkMark) {
              // 检查是否在链接末尾
              const nextPos = $from.pos + 1
              const nextNode = editor.state.doc.nodeAt(nextPos)
              const nextMarks = nextNode ? editor.state.doc.resolve(nextPos).marks() : []
              const hasLinkAtNext = nextMarks.some((mark: Mark) => mark.type.name === 'link' && mark.attrs.href === linkMark.attrs.href)

              if (!hasLinkAtNext) {
                editor.commands.unsetMark('link')
              }
            }
          }

          return false
        },
      }
    },

    addCommands() {
      return {
        // 扩展 setLink 命令以支持本站链接转换
        setLink: (attributes: { href: string }) => ({ commands }: { commands: ChainedCommands }) => {
          const { href } = attributes

          if (href && isSiteUrl(href)) {
            const converted = convertSiteUrl(href)

            // 如果是本站链接，使用转换后的显示文本
            return commands.insertContent([
              {
                type: 'text',
                text: converted.displayText,
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      'href': converted.href,
                      'data-site-link': 'true',
                    },
                  },
                ],
              },
            ])
          }

          // 对于非本站链接，使用原始逻辑
          return commands.setMark('link', attributes)
        },
      }
    },

    addInputRules() {
      return [
        // 添加 #XXXXXX 格式的题目 ID 识别
        {
          find: /(?:^|\s)(#[A-Z0-9]{6}) $/,
          handler: ({ range, match, commands }: { range: Range, match: RegExpMatchArray, commands: ChainedCommands }) => {
            const [, topicIdText] = match
            const topicId = parseTopicId(topicIdText)

            if (!topicId || !isValidTopicId(topicId)) {
              return
            }

            const topicUrl = generateTopicUrl(topicId)

            // 使用 commands 来替换内容并应用链接标记
            const from = range.from
            const to = range.to

            // 删除匹配的文本
            commands.deleteRange({ from, to })

            // 插入链接文本
            commands.insertContentAt(from, {
              type: 'text',
              text: topicIdText,
              marks: [{
                type: 'link',
                attrs: {
                  'href': topicUrl,
                  'data-site-link': 'true',
                  'data-topic-id': topicId,
                },
              }],
            })

            // 插入空格
            commands.insertContentAt(from + topicIdText.length, ' ')
          },
        },
      ]
    },

    addPasteRules() {
      return [
        // 本站链接识别
        {
          find: /(https?:\/\/\S*)/gi,
          handler: ({ match, commands, range }: { match: RegExpMatchArray, commands: ChainedCommands, range: Range }) => {
            const url = match[1]

            // 只处理本站链接
            if (!isSiteUrl(url)) {
              return null
            }

            const { displayText, href } = convertSiteUrl(url)

            // 如果是本站链接，异步获取更准确的标题
            fetchPageTitle(url).then(() => {
              // 这里可以考虑更新已插入的链接文本
              // 但为了简化，我们直接使用同步转换的结果
            }).catch(() => {
              // 忽略错误，使用同步转换的结果
            })

            // 删除匹配的文本并替换为链接
            const { from, to } = range
            commands.deleteRange({ from, to })
            commands.insertContent([
              {
                type: 'text',
                text: displayText,
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      href,
                      'data-site-link': 'true',
                    },
                  },
                ],
              },
            ])
          },
        },
        // #XXXXXX 格式的题目 ID 识别
        {
          find: /(#[A-Z0-9]{6})/g,
          handler: ({ match, commands, range }: { match: RegExpMatchArray, commands: ChainedCommands, range: Range }) => {
            const topicIdText = match[1]
            const topicId = parseTopicId(topicIdText)

            if (!topicId || !isValidTopicId(topicId)) {
              return null
            }

            const topicUrl = generateTopicUrl(topicId)

            // 删除匹配的文本并替换为链接
            const { from, to } = range
            commands.deleteRange({ from, to })
            commands.insertContent([
              {
                type: 'text',
                text: topicIdText,
                marks: [
                  {
                    type: 'link',
                    attrs: {
                      'href': topicUrl,
                      'data-site-link': 'true',
                      'data-topic-id': topicId,
                    },
                  },
                ],
              },
            ])
          },
        },
      ]
    },
  }).configure({
    ...config,
    openOnClick: openOnClick ?? config.openOnClick,
  })
}
