import { defineUserConfig } from '@vuepress/cli'
import { path, fs, chalk, logger } from '@vuepress/utils'
import viteCompilerOptions from '../../vite.config'
import YAML from 'yaml'
import dotenv from 'dotenv'
import * as chokidar from 'chokidar'

import type { ViteBundlerOptions } from 'vuepress-vite'
import type { DefaultThemeOptions } from 'vuepress'

dotenv.config({
  path: path.resolve(
    __dirname,
    '../../.env.' +
      (process.env.NODE_ENV === 'production' ? 'production' : 'development')
  ),
})

const isProd = process.env.NODE_ENV === 'production'

let localeData = {}

fs.readdirSync(path.resolve(__dirname, './locales')).forEach((val) => {
  localeData = Object.assign(
    localeData,
    YAML.parse(
      fs.readFileSync(path.resolve(__dirname, './locales/' + val), 'utf8')
    )
  )
})

console.log('Mode:', isProd ? 'Production' : 'development')

module.exports = defineUserConfig<DefaultThemeOptions, ViteBundlerOptions>({
  dest: path.resolve(__dirname, '../../dist'),
  public: 'public',
  base: process.env.BASE,
  bundler:
    // process.env.DOCS_BUNDLER ??
    // // use vite in dev, use webpack in prod
    // (isProd ? '@vuepress/webpack' : '@vuepress/vite'),
    process.env.DOCS_BUNDLER || '@vuepress/webpack',
  bundlerConfig: {},
  templateDev: path.resolve(__dirname, './templates/index.dev.html'),
  templateSSR: path.resolve(__dirname, './templates/index.ssr.html'),
  theme: path.resolve(__dirname, './theme/'),
  head: [
    ['meta', { name: 'charset', content: 'utf-8' }],
    [
      'meta',
      {
        name: 'viewport',
        content:
          'width=device-width,initial-scale=1,user-scalable=0,viewport-fit=cover',
      },
    ],
    ['meta', { name: 'origin', content: 'origin' }],
    ['meta', { name: 'renderer', content: process.env.RENDERER }],
    ['meta', { name: 'force-rendering', content: process.env.RENDERER }],
    ['meta', { name: 'applicable-device', content: 'pc,mobile' }],
    [
      'meta',
      { name: 'msapplication-titleColor', content: process.env.THEME_COLOR },
    ],
    [
      'meta',
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'lack-translucent',
      },
    ],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    [
      'meta',
      { name: 'apple-mobile-web-app-title', content: process.env.SITE_NAME },
    ],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
    ['meta', { name: 'google', content: 'notranslate' }],
    ['meta', { name: 'twitter:image', content: process.env.COVER }],
    ['meta', { itemprop: 'image', content: process.env.COVER }],
    [
      'link',
      { rel: 'manifest', href: process.env.BASE + 'manifest.webmanifest' },
    ],
    ['link', { rel: 'apple-touch-icon', href: process.env.APP_TOUCH_ICON }],
    ['link', { rel: 'shortcut icon', href: process.env.FAVICON }],
    [
      'link',
      {
        rel: 'mask-icon',
        href: process.env.BASE + process.env.MASK_ICON,
        color: process.env.THEME_COLOR,
      },
    ],
    [
      'script',
      {
        crossOrigin: 'anonymous',
        src: 'https://at.alicdn.com/t/font_2601360_4mb9h2g5y7k.js',
      },
    ],
    [
      'script',
      {
        crossOrigin: 'anonymous',
        src: 'https://polyfill.io/v3/polyfill.min.js?features=%7Ehtml5-elements%2CCSS.supports%2ClocalStorage%2Cdefault%2Ces6%2Ces2015%2Ces2016%2CElement.prototype.scroll%2CElement.prototype.scrollBy%2CglobalThis%2Cfetch%2CURLSearchParams',
      },
    ],
  ],
  locales: {
    '/': {
      lang: 'zh-CN',
      title: process.env.SITE_NAME,
      description: process.env.DESCRIPTION,
    },
    '/en/': {
      lang: 'en-US',
      title: process.env.SITE_NAME_EN,
      description: process.env.DESCRIPTION_EN,
    },
    '/ja/': {
      lang: 'ja-JP',
      title: process.env.DESCRIPTION_JA,
      description: process.env.DESCRIPTION_JA,
    },
  },
  themeConfig: {
    repo: process.env.REPO,
    repoLabel: 'Gitee',
    docsBranch: 'master',
    docsRepo: process.env.REPO_DOCS,
    docsDir: 'docs',
    editLinkPattern: ':repo/edit/:branch/:path',
    themePlugins: {
      mediumZoom: false,
      backToTop: false,
      container: {
        tip: false,
        warning: false,
        danger: false,
        details: false,
      },
    },
    locales: {
      ...localeData,
    },
  },
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        id: process.env.ANALYTICS_ID,
      },
    ],
    [
      '@vuepress/pwa',
      {
        skipWaiting: false,
      },
    ],
    [
      '@vuepress/plugin-pwa-popup',
      {
        locales: {
          '/en/': {
            message: 'New content is available.',
            buttonText: 'Refresh',
          },
          '/': {
            message: '发现新内容可用',
            buttonText: '刷新',
          },
          '/ja/': {
            message: '利用可能な新しいコンテンツが見つかりました',
            buttonText: 'リフレッシュ',
          },
        },
      },
    ],
    [
      '@vuepress/plugin-search',
      {
        maxSuggestions: 5,
        hotKeys: ['s', '/'],
        locales: {
          '/en/': {
            placeholder: 'Search ("/" to focus)',
          },
          '/': {
            placeholder: '搜索（“/” 聚焦）',
          },
          '/ja/': {
            placeholder: '検索する ("/" フォーカス)',
          },
        },
      },
    ],
    // [
    //   '@vuepress/docsearch',
    //   {
    //     apiKey: 'd66aafda844027d72f4ff85378d5f2f2',
    //     indexName: 'yuanshen.site',
    //     appId: 'J4CYOK33ZS',
    //     locales: {
    //       '/en/': {
    //         placeholder: 'Search',
    //       },
    //       '/': {
    //         placeholder: '搜索',
    //       },
    //       '/ja/': {
    //         placeholder: '検索する',
    //       },
    //     },
    //   },
    // ],
    [
      '@vuepress/register-components',
      {
        componentsDir: path.resolve(__dirname, './components'),
      },
    ],
    [
      'sitemap2',
      {
        hostname: process.env.DOMAIN + process.env.BASE,
        exclude: [],
      },
    ],
    [
      'feed2',
      false,
      //       {
      //         hostname: process.env.BASE,
      //       },
    ],
    [
      'seo2',
      {
        author: process.env.AUTHOR,
        twitterID: process.env.TWITTER_ID,
        restrictions: process.env.RESTRICTIONS,
        seo: () => {
          return {
            'twitter:card': 'summary',
          }
        },
        //   //   customMeta: (
        //   //     meta: [Record<'content' | 'name' | 'charset' | 'http-equiv', string>]
        //   //   ) => {
        //   //   },
      },
    ],
    [
      'md-enhance',
      {
        enableAll: true,
        tex: {
          strict: 'ignore',
        },
        presentation: {
          plugins: [
            'highlight',
            'math',
            'search',
            'notes',
            'zoom',
            'anything',
            'audio',
            'chalkboard',
          ],
        },
      },
    ],
    ['photo-swipe'],
    [
      'lightgallery',
      false,
      // {
      //   plugins: [
      //     "autoplay",
      //     "fullscreen",
      //     "pager",
      //     "rotate",
      //     "share",
      //     "zoom",
      //   ],
      // },
    ],
    ['@vuepress/plugin-toc'],

    [
      // 主题在线演示网址https://vscodethemes.com/
      '@vuepress/plugin-shiki',
      isProd
        ? {
            theme: 'github-dark',
          }
        : false,
    ],
    ['@vuepress/plugin-debug'],
  ],
  onWatched: (_, watchers, restart) => {
    const watcher = chokidar.watch('locales/*.yml', {
      cwd: __dirname,
      ignoreInitial: true,
    })
    watcher.on('change', async (file) => {
      logger.info(`file ${chalk.magenta(file)} is modified`)
      await restart()
    })
    watchers.push(watcher)
  },
})
