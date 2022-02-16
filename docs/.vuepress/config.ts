import { defineUserConfig } from '@vuepress/cli'
import { path, fs, chalk, logger } from '@vuepress/utils'
import { dayjs } from './utils'
import YAML from 'yaml'
import dotenv from 'dotenv'
import * as chokidar from 'chokidar'
import viteCompilerOptions from '../../vite.config'
import webpackCompilerOptions from '../../webpack.config'

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

console.log('Mode:', isProd ? 'Production' : 'development')

/**
 * @description Vuepress2 config
 * @link https://v2.vuepress.vuejs.org/reference/config.html
 */
module.exports = defineUserConfig<DefaultThemeOptions>({
  base: '/docs/',
  dest: path.resolve(__dirname, '../../dist'),
  public: 'public',

  title: process.env.SITE_NAME,
  description: process.env.DESCRIPTION,

  bundler:
    // process.env.DOCS_BUNDLER ??
    // // use vite in dev, use webpack in prod
    // (isProd ? '@vuepress/webpack' : '@vuepress/vite'),
    process.env.DOCS_BUNDLER || '@vuepress/webpack',
  bundlerConfig: {
    evergreen: false,
  },

  templateDev: path.resolve(__dirname, './templates/index.dev.html'),
  templateBuild: path.resolve(__dirname, './templates/index.ssr.html'),

  theme: path.resolve(__dirname, './theme/'),

  head: [
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
    ['link', { rel: 'manifest', href: './manifest.webmanifest' }],
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
        src: '//at.alicdn.com/t/font_2601360_6gw2axvn0ee.js',
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

  // site-level locales config
  locales: {
    /**
     * Chinese locale config
     */
    '/': {
      lang: 'zh-CN',
      title: process.env.SITE_NAME,
      description: process.env.DESCRIPTION,
    },

    /**
     * English locale config
     */
    '/en/': {
      lang: 'en-US',
      title: process.env.SITE_NAME_EN,
      description: process.env.DESCRIPTION_EN,
    },
  },

  /**
   * @description Vuepress2 theme config
   * @link https://v2.vuepress.vuejs.org/reference/theme-api.html
   */
  themeConfig: {
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
    locales: (() => {
      let localeData = {}

      fs.readdirSync(path.resolve(__dirname, './locales')).forEach((val) => {
        localeData = Object.assign(
          localeData,
          YAML.parse(
            fs.readFileSync(path.resolve(__dirname, './locales/' + val), 'utf8')
          )
        )
      })
      return localeData
    })(),
  },
  plugins: [
    /**
     * @description This plugin will import gtag.js for Google Analytics 4.
     * @link https://v2.vuepress.vuejs.org/reference/plugin/google-analytics.html
     */
    [
      '@vuepress/google-analytics',
      {
        // we have multiple deployments, which would use different id
        id: process.env.ANALYTICS_ID,
      },
    ],

    /**
     * @description This plugin uses workbox-build to generate service worker file, and uses register-service-worker to register service worker.
     * @link https://v2.vuepress.vuejs.org/reference/plugin/pwa.html
     */
    // [
    //   '@vuepress/pwa',
    //   {
    //     skipWaiting: false,
    //   },
    // ],

    /**
     * @description This plugin must be used together with pwa plugin, and the skipWaiting option must not be set to true.
     * @link https://v2.vuepress.vuejs.org/reference/plugin/pwa-popup.html
     */
    // [
    //   '@vuepress/plugin-pwa-popup',
    //   {
    //     locales: {
    //       '/en/': {
    //         message: 'New content is available.',
    //         buttonText: 'Refresh',
    //       },
    //       '/': {
    //         message: '发现新内容可用',
    //         buttonText: '刷新',
    //       },
    //       '/ja/': {
    //         message: '利用可能な新しいコンテンツが見つかりました',
    //         buttonText: 'リフレッシュ',
    //       },
    //     },
    //   },
    // ],

    /**
     * @description Provide local search to your documentation site
     * @link https://v2.vuepress.vuejs.org/reference/plugin/search.html
     */
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
        },
        // 允许搜索 Frontmatter 中的 `tags`
        getExtraFields: (page: { frontmatter: { tags: any } }) =>
          page.frontmatter.tags ?? [],
      },
    ],
    /**
     * @description Algolia DocSearch
     * @link https://v2.vuepress.vuejs.org/reference/plugin/docsearch.html
     */
    [
      '@vuepress/docsearch',
      false,
      // {
      //   apiKey: 'd66aafda844027d72f4ff85378d5f2f2',
      //   indexName: 'yuanshen.site',
      //   appId: 'J4CYOK33ZS',
      //   locales: {
      //     '/en/': {
      //       placeholder: 'Search',
      //     },
      //     '/': {
      //       placeholder: '搜索',
      //     },
      //     '/ja/': {
      //       placeholder: '検索する',
      //     },
      //   },
      // },
    ],
    /**
     * @description Register Vue components from component files or directory automatically.
     * @link https://v2.vuepress.vuejs.org/reference/plugin/register-components.html
     */
    [
      '@vuepress/register-components',
      {
        componentsDir: path.resolve(__dirname, './components'),
      },
    ],

    /**
     * @todo
     */
    [
      'sitemap2',
      {
        hostname: 'htttps://yuanshen.site/docs',
        exclude: [],
      },
    ],

    /**
     * @Todo
     */
    ['vuepress-plugin-pwa2'],
    /**
     * @todo
     */
    [
      'vuepress-plugin-feed2',
      {
        hostname: 'https://yuanshen.site/docs',
      },
    ],

    /**
     * @todo
     */
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
        //   customMeta: (
        //     meta: [Record<'content' | 'name' | 'charset' | 'http-equiv', string>]
        //   ) => {
        //   },
      },
    ],

    /**
     * @description  use more syntax in your Markdown files.
     * @link https://vuepress-theme-hope.github.io/md-enhance/guide/
     */
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

    /**
     * @todo
     */
    [
      'lightgallery',
      {
        plugins: ['autoplay', 'fullscreen', 'pager', 'rotate', 'share', 'zoom'],
      },
    ],

    /**
     * @description This plugin will provide a table-of-contents (TOC) component
     * @link https://v2.vuepress.vuejs.org/reference/plugin/toc.html
     */
    ['@vuepress/plugin-toc'],
    ['vuepress-plugin-copy-code2'],

    /**
     * @description This plugin will enable syntax highlighting for markdown code fence with Shiki
     * @link https://v2.vuepress.vuejs.org/reference/plugin/shiki.html
     */
    [
      '@vuepress/plugin-shiki',
      // only enable shiki plugin in production mode
      isProd
        ? {
            /**
             * @description shiki theme preview
             * @link https://vscodethemes.com/
             */
            theme: 'github-dark',
          }
        : false,
    ],
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
