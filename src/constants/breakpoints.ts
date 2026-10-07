/** 移动端断点（JS 侧唯一来源；CSS 侧 --site-mobile 见 theme/styles/media.css，tests/theme 锁定两侧一致） */
export const SITE_MOBILE_BREAKPOINT_PX = 959

export const SITE_MOBILE_MEDIA_QUERY = `(max-width: ${SITE_MOBILE_BREAKPOINT_PX}px)`
export const SITE_DESKTOP_MEDIA_QUERY = `(min-width: ${SITE_MOBILE_BREAKPOINT_PX + 1}px)`
