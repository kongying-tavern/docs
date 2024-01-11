import Unocss from 'unocss/vite'
import MarkdownItFootnote from 'markdown-it-footnote'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, HeadConfig } from 'vitepress'
import { colorPreviewPlugin } from './theme/markdown/colorPreview'
import { cardPlugin } from './theme/markdown/card'
import { figure } from '@mdit/plugin-figure'
import { imgSize, obsidianImageSize } from '@mdit/plugin-img-size'
import { mark } from '@mdit/plugin-mark'
import { sub } from '@mdit/plugin-sub'
import { sup } from '@mdit/plugin-sup'

import { enConfig } from './locales/en'
import { zhConfig } from './locales/zh'
import { jaConfig } from './locales/ja'
import { koConfig } from './locales/ko'
import { frConfig } from './locales/fr'

export const isProd = process.env.NODE_ENV === 'production'
export const commitRef = process.env.COMMIT_REF?.slice(0, 8) || 'dev'
export const productionHead: HeadConfig[] = [
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
    {"@context":"https://schema.org","@type":"WebPage","name":Kongying Tavern Genshin Interactive Map"}`,
  ],
]

export default defineConfig({
  lastUpdated: true,
  srcDir: 'src',
  outDir: './dist',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
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
          kr: {
            translations: {
              button: {
                buttonText: '찾다',
                buttonAriaLabel: '찾다',
              },
              modal: {
                noResultsText: '관련 결과가 없습니다',
                resetButtonTitle: '검색 재설정',
                footer: {
                  selectText: '선택하다',
                  navigateText: '전환하다',
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
    ko: {
      label: '한국인',
      lang: 'ko-KR',
      link: '/ko/',
      ...koConfig,
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      link: '/fr/',
      ...frConfig,
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
        href: `https://yuanshen.site/docs/imgs/favicon-32x32.png`,
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
        href: `https://yuanshen.site/docs/imgs/favicon.ico`,
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
  transformHead(content) {
    const { pageData, siteConfig } = content
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'og:url',
        content: `https://yuanshen.site/${
          siteConfig.site.base
        }${pageData.relativePath.replace('.md', '')}`,
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'twitter:url',
        content: `https://yuanshen.site/${
          siteConfig.site.base
        }${pageData.relativePath.replace('.md', '')}`,
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'og:title',
        content: pageData.frontmatter.title
          ? pageData.frontmatter.title
          : 'Kongying Tavern',
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'twitter:title',
        content: pageData.frontmatter.title
          ? pageData.frontmatter.title
          : 'Kongying Tavern',
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'og:description',
        content: pageData.frontmatter.description
          ? pageData.frontmatter.description
          : `Genshin Interactive Map
A Completionist's Interactive Map by Kongying Tavern`,
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'twitter:description',
        content: pageData.frontmatter.description
          ? pageData.frontmatter.description
          : `Genshin Interactive Map
A Completionist's Interactive Map by Kongying Tavern`,
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'description',
        content: pageData.frontmatter.description
          ? pageData.frontmatter.description
          : `Genshin Interactive Map
A Completionist's Interactive Map by Kongying Tavern`,
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'keywords',
        content: pageData.frontmatter.keywords
          ? pageData.frontmatter.keywords
          : '空荧酒馆,空荧地图,空荧酒馆原神地图,原神全资源攻略地图,原神攻略地图,原神地图,原神电子地图,原神互动地图,Genshin,Genshin_map,Genshin_Treasure,Genshin Map,Genshin Impact Map,Genshin Impact Interactive Map',
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'og:image',
        content: pageData.frontmatter.image
          ? pageData.frontmatter.image
          : 'https://yuanshen.site/docs/cover.jpg',
      },
    ])
    pageData.frontmatter.head.push([
      'meta',
      {
        name: 'twitter:image',
        content: pageData.frontmatter.image
          ? pageData.frontmatter.image
          : 'https://yuanshen.site/docs/cover.jpg',
      },
    ])
  },
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
    },
  },
})
