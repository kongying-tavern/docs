// 自定义主题字段契约:形状由 zh(默认)模块推导,其余语言模块按此注解校验
export interface CustomConfig {
  footer: typeof import('./zh/footer').default
  ui: typeof import('./zh/ui').default
  asideLinks: typeof import('./zh/aside-links').default
  docReaction: typeof import('./zh/docs-feedback').default
  staff: typeof import('./zh/staff').default
  team: typeof import('./zh/team').default
  payment: typeof import('./zh/payment').default
  forum: typeof import('./zh/forum').default
  changelog: typeof import('./zh/changelog').default
}

// 每语言界面文案契约(index.ts 的 themeConfig 部分)
export interface LocaleTextConfig {
  outlineTitle: string
  lastUpdatedText: string
  returnToTopLabel: string
  langMenuLabel: string
  docFooter: {
    prev: string
    next: string
  }
}

// 语言 index.ts 的最小形状:只声明翻译文案,主题装配由注册层按目录约定完成
export interface LocaleConfigShape {
  title: string
  titleTemplate: string
  themeConfig: LocaleTextConfig
}

export interface CustomConstant {
  META_URL: string
  META_TITLE: string
  META_KEYWORDS: string
  META_DESCRIPTION: string
  META_IMAGE: string
  LOCAL_CODE: string
  LOCAL_BASE: string
}
