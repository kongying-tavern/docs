export const BANNER_CONSTANTS = {
  /** 一天的毫秒数 */
  ONE_DAY_MS: 24 * 60 * 60 * 1000,
  /** Banner 高度偏移量 */
  HEIGHT_OFFSET: 16,
  /** 动画延迟时间 */
  ANIMATION_DELAY: 0.3,
  /** 最小布局高度 */
  MIN_LAYOUT_HEIGHT: '0.1px',
} as const

export const BANNER_SELECTORS = {
  /** CSS 变量：布局顶部高度 */
  LAYOUT_TOP_HEIGHT: '--vp-layout-top-height',
} as const
