/**
 * QQ自动链接扩展配置选项
 */

/** Matches valid QQ number format */
const QQ_NUMBER_FORMAT_REGEX = /^[1-9]\d{4,10}$/

/** Matches non-digit characters */
const NON_DIGIT_REGEX = /\D/g

export interface QQAutoLinkConfig {
  /** 是否启用QQ号自动识别 */
  enabled?: boolean
  /** 自定义QQ号匹配正则表达式 */
  pattern?: RegExp
  /** 自定义链接生成函数 */
  linkGenerator?: (qq: string) => string
  /** 自定义CSS类名 */
  className?: string
  /** 是否在新窗口打开链接 */
  openInNewWindow?: boolean
  /** 链接前缀图标 */
  icon?: string
  /** 自定义链接文本格式化 */
  textFormatter?: (qq: string) => string
  /** 自定义悬停提示文本 */
  titleGenerator?: (qq: string) => string
}

/**
 * 默认配置
 */
export const defaultQQAutoLinkConfig: Required<QQAutoLinkConfig> = {
  enabled: true,
  pattern: /QQ( )?[1-9]\d{4,10}/,
  linkGenerator: (qq: string) => `https://wpa.qq.com/msgrd?v=3&uin=${qq}&site=qq&menu=yes`,
  className: 'qq-link',
  openInNewWindow: true,
  icon: '💬',
  textFormatter: (qq: string) => `QQ${qq}`,
  titleGenerator: (qq: string) => `联系QQ：${qq}`,
}

/**
 * 合并用户配置和默认配置
 */
export function mergeQQAutoLinkConfig(userConfig: QQAutoLinkConfig = {}): Required<QQAutoLinkConfig> {
  return {
    ...defaultQQAutoLinkConfig,
    ...userConfig,
  }
}

/**
 * 预设配置
 */
export const qqLinkPresets = {
  /** 默认配置 */
  default: defaultQQAutoLinkConfig,

  /** 简约模式 - 无图标 */
  minimal: {
    ...defaultQQAutoLinkConfig,
    icon: '',
  } as Required<QQAutoLinkConfig>,

  /** 紧凑模式 - 只显示QQ号 */
  compact: {
    ...defaultQQAutoLinkConfig,
    textFormatter: (qq: string) => qq,
    icon: '',
  } as Required<QQAutoLinkConfig>,

  /** 企业模式 - 使用企业QQ */
  enterprise: {
    ...defaultQQAutoLinkConfig,
    linkGenerator: (qq: string) => `https://wpa.b.qq.com/cgi/wpa.php?ln=1&key=${qq}`,
    icon: '🏢',
    titleGenerator: (qq: string) => `企业QQ联系：${qq}`,
  } as Required<QQAutoLinkConfig>,
}

/**
 * 验证QQ号格式
 */
export function validateQQNumber(qq: string): boolean {
  return QQ_NUMBER_FORMAT_REGEX.test(qq)
}

/**
 * 提取QQ号码
 */
export function extractQQNumber(text: string, pattern?: RegExp): string | null {
  const regex = pattern || defaultQQAutoLinkConfig.pattern
  const match = text.match(regex)

  if (match) {
    // 返回匹配到的数字部分
    const digits = match[0].replace(NON_DIGIT_REGEX, '')
    return validateQQNumber(digits) ? digits : null
  }

  return null
}

/**
 * 生成QQ链接HTML
 */
export function generateQQLinkHTML(qq: string, config: Required<QQAutoLinkConfig>): string {
  const href = config.linkGenerator(qq)
  const text = config.textFormatter(qq)
  const title = config.titleGenerator(qq)
  const className = config.className
  const target = config.openInNewWindow ? '_blank' : '_self'
  const rel = config.openInNewWindow ? 'noopener noreferrer' : ''

  return `<a href="${href}" class="${className} vp-link" target="${target}" rel="${rel}" title="${title}" data-qq="${qq}">${config.icon}${text}</a>`
}
