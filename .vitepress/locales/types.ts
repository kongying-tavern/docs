// 其余语言模块按此契约与 zh(默认)结构对齐
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
