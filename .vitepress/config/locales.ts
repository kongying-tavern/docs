import type { DefaultTheme, HeadConfig, LocaleConfig } from 'vitepress'
import type { CustomConstant, LocaleConfigShape } from '../locales/types'
import { DEFAULT_LOCALE, SITE_LOGO } from '../locales/common/site'
import { baseHelper } from '../theme/utils'
import { getLocaleDirs } from './localeDirs'

// 约定:locales 目录下含 index.ts 的子目录即一门语言,导出 <lang>Config/label/lang;zh 为默认语言(root)
const STATIC_FIELDS = [
  ['notFound', '404'],
  ['ui', 'ui'],
  ['asideLinks', 'aside-links'],
  ['docReaction', 'docs-feedback'],
  ['staff', 'staff'],
  ['team', 'team'],
  ['payment', 'payment'],
  ['forum', 'forum'],
  ['changelog', 'changelog'],
] as const
const LINKED_FIELDS = ['nav', 'sidebar', 'footer'] as const

// Vite 会把配置打包到 node_modules/.vite-temp/ 下执行,模板字符串动态导入
// 会原样保留并相对该临时目录解析,导致构建时 ERR_MODULE_NOT_FOUND。
// 因此各模块必须以字符串字面量动态导入,由打包器静态打进配置产物;
// 新增语言时(见 pnpm init:locale)需在此补充对应分支。
type LocaleModule = () => Promise<{ default: unknown }>
type LocaleIndexModule = () => Promise<unknown>

// locale 入口只有具名导出(<lang>Config/label/lang),与其余默认导出模块分开登记
const localeIndexImporters: Record<string, LocaleIndexModule> = {
  en: () => import('../locales/en/index.ts'),
  ja: () => import('../locales/ja/index.ts'),
  zh: () => import('../locales/zh/index.ts'),
}
const importers: Record<string, Record<string, LocaleModule>> = {
  en: {
    '404': () => import('../locales/en/404.ts'),
    'aside-links': () => import('../locales/en/aside-links.ts'),
    'changelog': () => import('../locales/en/changelog.ts'),
    'constants': () => import('../locales/en/constants.ts'),
    'docs-feedback': () => import('../locales/en/docs-feedback.ts'),
    'footer': () => import('../locales/en/footer.ts'),
    'forum': () => import('../locales/en/forum.ts'),
    'head': () => import('../locales/en/head.ts'),
    'nav': () => import('../locales/en/nav.ts'),
    'payment': () => import('../locales/en/payment.ts'),
    'sidebar': () => import('../locales/en/sidebar.ts'),
    'staff': () => import('../locales/en/staff.ts'),
    'team': () => import('../locales/en/team.ts'),
    'ui': () => import('../locales/en/ui.ts'),
  },
  ja: {
    '404': () => import('../locales/ja/404.ts'),
    'aside-links': () => import('../locales/ja/aside-links.ts'),
    'changelog': () => import('../locales/ja/changelog.ts'),
    'constants': () => import('../locales/ja/constants.ts'),
    'docs-feedback': () => import('../locales/ja/docs-feedback.ts'),
    'footer': () => import('../locales/ja/footer.ts'),
    'forum': () => import('../locales/ja/forum.ts'),
    'head': () => import('../locales/ja/head.ts'),
    'nav': () => import('../locales/ja/nav.ts'),
    'payment': () => import('../locales/ja/payment.ts'),
    'sidebar': () => import('../locales/ja/sidebar.ts'),
    'staff': () => import('../locales/ja/staff.ts'),
    'team': () => import('../locales/ja/team.ts'),
    'ui': () => import('../locales/ja/ui.ts'),
  },
  zh: {
    '404': () => import('../locales/zh/404.ts'),
    'aside-links': () => import('../locales/zh/aside-links.ts'),
    'changelog': () => import('../locales/zh/changelog.ts'),
    'constants': () => import('../locales/zh/constants.ts'),
    'docs-feedback': () => import('../locales/zh/docs-feedback.ts'),
    'footer': () => import('../locales/zh/footer.ts'),
    'forum': () => import('../locales/zh/forum.ts'),
    'head': () => import('../locales/zh/head.ts'),
    'nav': () => import('../locales/zh/nav.ts'),
    'payment': () => import('../locales/zh/payment.ts'),
    'sidebar': () => import('../locales/zh/sidebar.ts'),
    'staff': () => import('../locales/zh/staff.ts'),
    'team': () => import('../locales/zh/team.ts'),
    'ui': () => import('../locales/zh/ui.ts'),
  },
}

export async function createLocalesConfig(): Promise<LocaleConfig<DefaultTheme.Config>> {
  const locales: LocaleConfig<DefaultTheme.Config> = {}
  for (const lang of getLocaleDirs()) {
    const mods = importers[lang]
    const loadIndex = localeIndexImporters[lang]
    if (!mods || !loadIndex) {
      throw new Error(`Missing locale importers for "${lang}" in .vitepress/config/locales.ts`)
    }
    const mod = (await loadIndex()) as {
      label: string
      lang: string
      [key: string]: unknown
    }
    const config = mod[`${lang}Config`] as LocaleConfigShape
    if (!config) {
      throw new Error(`Missing ${lang}Config export in .vitepress/locales/${lang}/index.ts`)
    }

    const constants = (await mods.constants()).default as CustomConstant
    const themeConfig: Record<string, unknown> = {
      siteTitle: constants.META_TITLE,
      keyword: constants.META_KEYWORDS,
      image: constants.META_IMAGE,
      logo: SITE_LOGO,
    }
    for (const [field, module] of STATIC_FIELDS) {
      themeConfig[field] = (await mods[module]()).default
    }
    for (const field of LINKED_FIELDS) {
      const content = (await mods[field]()).default as Record<string, unknown>
      themeConfig[field] = baseHelper(content, constants.LOCAL_BASE)
    }
    Object.assign(themeConfig, config.themeConfig)

    const head = (await mods.head()).default as HeadConfig[]
    const key = lang === DEFAULT_LOCALE ? 'root' : lang
    locales[key] = {
      label: mod.label,
      lang: mod.lang,
      ...config,
      description: constants.META_DESCRIPTION,
      head,
      themeConfig: themeConfig as DefaultTheme.Config,
    }
  }
  return locales
}
