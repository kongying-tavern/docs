import Unocss from 'unocss/vite'
import MarkdownItFootnote from 'markdown-it-footnote'
import MarkdownItKbd from 'markdown-it-kbd-better'
import MarkdownItColorInline from 'markdown-it-color-inline'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'
import type {
  DefaultTheme,
  HeadConfig,
  PageData,
  SiteConfig,
  UserConfig,
  LocaleSpecificConfig,
  TransformContext,
  TransformPageContext,
} from 'vitepress'
import type { CustomConfig } from './locales/types'
import { colorPreviewPlugin } from './theme/markdown/colorPreview'
import { cardPlugin } from './theme/markdown/card'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'
import { timeline } from './theme/markdown/timeline'
import { qa } from './theme/markdown/qa'

import { enConfig } from './locales/en'
import { zhConfig } from './locales/zh'
import { jaConfig } from './locales/ja'

const isProd = process.env.NODE_ENV === 'production'
const commitRef = process.env.COMMIT_REF?.slice(0, 8) || 'dev'
const productionHead: HeadConfig[] = [
  [
    'script',
    {
      id: 'clarity-script',
    },
    `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "gx0jeyqvg5")`,
  ],
  [
    'script',
    {
      id: 'application-json',
      type: 'application/ld+json',
    },
    `
    {"@context":"https://schema.org","@type":"WebPage","name":"Kongying Tavern Genshin Interactive Map"}`,
  ],
]

type ConfigureFuncType = Pick<
  UserConfig<DefaultTheme.Config>,
  'transformHead' | 'transformPageData'
>
type LocaleConfigVal = LocaleSpecificConfig<DefaultTheme.Config & CustomConfig>

const cfgGetPageUrl = (pageData: PageData, siteConfig: SiteConfig): string =>
  `https://yuanshen.site/${siteConfig.site.base}${pageData.relativePath.replace('.md', '')}`
const cfgGetPageTitle = (pageData: PageData, siteConfig: SiteConfig): string =>
  pageData.frontmatter.title ? pageData.frontmatter.title : 'Kongying Tavern'
const cfgGetPageDesc = (pageData: PageData, siteConfig: SiteConfig): string =>
  pageData.frontmatter.description
    ? pageData.frontmatter.description
    : `Genshin Interactive Map\nA Completionist's Interactive Map by Kongying Tavern`
const cfgGetPageKeywords = (
  pageData: PageData,
  siteConfig: SiteConfig,
): string =>
  pageData.frontmatter.keywords
    ? pageData.frontmatter.keywords
    : '空荧酒馆,空荧地图,空荧酒馆原神地图,原神全资源攻略地图,原神攻略地图,原神地图,原神电子地图,原神互动地图,Genshin,Genshin_map,Genshin_Treasure,Genshin Map,Genshin Impact Map,Genshin Impact Interactive Map'
const cfgGetPageCover = (pageData: PageData, siteConfig: SiteConfig): string =>
  pageData.frontmatter.image
    ? pageData.frontmatter.image
    : 'https://yuanshen.site/docs/imgs/common/cover.jpg'

const cfgDynamicHead = (pageData: PageData, siteConfig: SiteConfig): void => {
  if (!isProd) return

  const pageUrl = cfgGetPageUrl(pageData, siteConfig)
  const pageTitle = cfgGetPageTitle(pageData, siteConfig)
  const pageDesc = cfgGetPageDesc(pageData, siteConfig)
  const pageKeywords = cfgGetPageKeywords(pageData, siteConfig)
  const pageCover = cfgGetPageCover(pageData, siteConfig)

  const head: any = [
    ['meta', { name: 'og:url', content: pageUrl }],
    ['meta', { name: 'twitter:url', content: pageUrl }],
    ['meta', { name: 'og:title', content: pageTitle }],
    ['meta', { name: 'twitter:title', content: pageTitle }],
    ['meta', { name: 'og:description', content: pageDesc }],
    ['meta', { name: 'twitter:description', content: pageDesc }],
    ['meta', { name: 'description', content: pageDesc }],
    ['meta', { name: 'keywords', content: pageKeywords }],
    ['meta', { name: 'og:image', content: pageCover }],
    ['meta', { name: 'twitter:image', content: pageCover }],
  ]

  pageData.frontmatter.head ??= []
  pageData.frontmatter.head.splice(Infinity, 0, ...head)
}
const cfgDynamicTitleTemplate = (
  pageData: PageData,
  siteConfig: SiteConfig,
): void => {
  let titleTemplate: string | boolean =
    pageData.frontmatter.titleTemplate ?? siteConfig.userConfig.titleTemplate
  if (titleTemplate === null || titleTemplate === undefined) {
    const localeKey: string =
      pageData.relativePath === pageData.filePath
        ? pageData.relativePath.split('/', 1)[0]
        : 'root'
    const localeConfig: LocaleConfigVal =
      siteConfig.userConfig.locales![localeKey] ?? {}
    const templateMappings: CustomConfig['ui']['title']['templateMappings'] =
      localeConfig.themeConfig?.ui.title.templateMappings ?? []
    for (let templateMapping of templateMappings) {
      if (
        templateMapping.test &&
        templateMapping.test.test(pageData.relativePath)
      ) {
        titleTemplate = templateMapping.template
        break
      }
    }
  }
  pageData.titleTemplate = titleTemplate
}

const createConfigureFunction = (): ConfigureFuncType => {
  if (isProd) {
    return {
      transformHead: (context: TransformContext) => {
        const { pageData, siteConfig } = context
        cfgDynamicHead(pageData, siteConfig)
      },
      transformPageData: (
        pageData: PageData,
        context: TransformPageContext,
      ) => {
        const { siteConfig } = context
        cfgDynamicTitleTemplate(pageData, siteConfig)
      },
    }
  } else {
    return {
      transformPageData: (
        pageData: PageData,
        context: TransformPageContext,
      ) => {
        const { siteConfig } = context
        cfgDynamicHead(pageData, siteConfig)
        cfgDynamicTitleTemplate(pageData, siteConfig)
      },
    }
  }
}

export default defineConfig({
  srcDir: 'src',
  outDir: './dist',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
  lastUpdated: true,
  sitemap: {
    hostname: 'https://yuanshen.site',
  },
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索',
            buttonAriaLabel: '搜索',
          },
          modal: {
            noResultsText: '无法找到相关结果',
            resetButtonTitle: '清除查询条件',
            footer: {
              selectText: '选择',
              navigateText: '切换',
            },
          },
        },
        locales: {
          en: {
            translations: {
              button: {
                buttonText: 'Search',
                buttonAriaLabel: 'Search',
              },
              modal: {
                noResultsText: 'No results for',
                resetButtonTitle: 'Reset search',
                footer: {
                  selectText: 'to select',
                  navigateText: 'to navigate',
                },
              },
            },
          },
          fr: {
            translations: {
              button: {
                buttonText: 'Recherche',
                buttonAriaLabel: 'Recherche',
              },
              modal: {
                noResultsText: 'Aucun résultat pour',
                resetButtonTitle: 'Réinitialiser la recherche',
                footer: {
                  selectText: 'pour sélectionner',
                  navigateText: 'naviguer',
                },
              },
            },
          },
          ja: {
            translations: {
              button: {
                buttonText: '検索',
                buttonAriaLabel: '検索',
              },
              modal: {
                noResultsText: '結果はありません',
                resetButtonTitle: '検索をリセットする',
                footer: {
                  selectText: '選ぶ',
                  navigateText: '切り替える',
                },
              },
            },
          },
        },
      },
    },
    outline: {
      level: [2, 4],
    },
  },
  rewrites: {
    'zh/:splat(.*)': ':splat',
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      link: '/',
      ...zhConfig,
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      ...enConfig,
    },
    ja: {
      label: '日本語',
      lang: 'ja-JP',
      link: '/ja/',
      ...jaConfig,
    },
  },
  head: [
    [
      'meta',
      {
        name: 'viewport',
        content:
          'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,viewport-fit=cover',
      },
    ],
    [
      'meta',
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'lack-translucent',
      },
    ],
    [
      'meta',
      {
        name: 'applicable-device',
        content: 'pc,mobile',
      },
    ],
    [
      'meta',
      {
        name: 'google',
        content: 'notranslate',
      },
    ],
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    ['meta', { name: 'color-scheme', content: 'dark light' }],
    [
      'link',
      {
        rel: 'icon',
        href: `https://yuanshen.site/docs/imgs/common/favicon/favicon-32x32.png`,
        type: 'image/png',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        hreflang: 'zh',
        href: 'https://yuanshen.site/docs',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        hreflang: 'en',
        href: 'https://yuanshen.site/docs/en',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        hreflang: 'fr',
        href: 'https://yuanshen.site/docs/fr',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        hreflang: 'ja',
        href: 'https://yuanshen.site/docs/ja',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        hreflang: 'kr',
        href: 'https://yuanshen.site/docs/kr',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        href: `https://yuanshen.site/docs/feed.rss`,
        type: 'application/rss',
      },
    ],
    [
      'link',
      {
        rel: 'alternate',
        href: `https://yuanshen.site/docs/imgs/common/favicon/favicon.ico`,
        type: 'image/x-icon',
      },
    ],
    ['meta', { name: 'referrer', content: 'no-referrer-when-downgrade' }],
    ['meta', { property: 'og:site', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:creator', content: '@KongyingTavern' }],
    ['meta', { name: 'twitter:widgets:csp', content: 'on' }],
    ...(isProd ? productionHead : []),
  ],
  ignoreDeadLinks: [
    // ignore exact url "/playground"
    '/playground',
    // ignore all localhost links
    /^https?:\/\/localhost/,
    // ignore all links include "/repl/""
    /\/repl\//,
    // custom function, ignore all links include "ignore"
    (url) => {
      return url.toLowerCase().includes('ignore')
    },
  ],
  vite: {
    server: {
      host: true,
      fs: {
        allow: ['../..'],
      },
    },
    resolve: {
      alias: [
        {
          find: /^.*\/VPFooter\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/Footer.vue', import.meta.url),
          ),
        },
      ],
    },
    plugins: [
      // https://github.com/antfu/unocss
      Unocss(),
    ],
    json: {
      stringify: true,
    },
  },
  ...createConfigureFunction(),
  markdown: {
    image: {
      lazyLoading: true,
    },
    config(md) {
      md.use(MarkdownItFootnote)
      md.use(colorPreviewPlugin)
      md.use(cardPlugin)
      md.use(sub)
      md.use(sup)
      md.use(mark)
      md.use(imgSize)
      md.use(obsidianImageSize)
      md.use(figure)
      md.use(timeline)
      md.use(qa)
      md.use(MarkdownItColorInline)
      md.use(MarkdownItKbd, {
        presets: [
          {
            name: 'icons',
          },
        ],
      })
    },
  },
})
