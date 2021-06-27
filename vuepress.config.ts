import { defineUserConfig } from 'vuepress'
import * as config from './config'
import type { DefaultThemeOptions } from 'vuepress'
import { path } from '@vuepress/utils'

const rootPath = config.default.host + config.default.root_path
const isProd = process.env.NODE_ENV === 'production'

module.exports = defineUserConfig<DefaultThemeOptions>({
  bundler: '@vuepress/webpack', // Vite 仍然存在兼容问题和奇怪的Bug, 无法使用。
  bundlerConfig: {
    // ...viteCompilerOptions,
  },
  dest: 'dist',
  public: 'public',
  base: config.default.root_path,
  theme: path.resolve(__dirname, './docs/.vuepress/theme/'),
  head: [
    ['meta', { name: 'charset', content: 'utf-8' }],
    [
      'meta',
      {
        name: 'viewport',
        content:
          'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=0,viewport-fit=cover',
      },
    ],
    ['meta', { name: 'renderer', content: config.default.defaultRenderer }],
    [
      'meta',
      { name: 'force-rendering', content: config.default.defaultRenderer },
    ],
    ['meta', { name: 'applicable-device', content: 'pc,mobile' }],
    [
      'meta',
      { name: 'msapplication-titleColor', content: config.default.themeColor },
    ],
    ['meta', { name: 'theme-color', content: config.default.themeColor }],
    [
      'meta',
      {
        name: 'msappdivcation-navbutton-color',
        content: config.default.themeColor,
      },
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
      { name: 'apple-mobile-web-app-title', content: config.default.site_name },
    ],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
    ['meta', { name: 'google', content: 'notranslate' }],
    ['meta', { name: 'twitter:image', content: config.default.cover }],
    ['meta', { itemprop: 'image', content: config.default.cover }],
    ['link', { rel: 'manifest', href: 'manifest.webmanifest' }],
    [
      'link',
      { rel: 'apple-touch-icon', href: config.default.apple_touch_icon },
    ],
    ['link', { rel: 'shortcut icon', href: config.default.favicon }],
    [
      'link',
      {
        rel: 'mask-icon',
        href: rootPath + config.default.mask_icon,
        color: config.default.themeColor,
      },
    ],
    [
      'script',
      {
        crossOrigin: 'anonymous',
        src: 'https://at.alicdn.com/t/font_2601360_kwt9b79krqc.js',
      },
    ],
  ],
  locales: {
    '/': {
      lang: 'zh-Hans-CN',
      title: config.default.site_name,
      description: config.default.description,
    },
    '/en/': {
      lang: 'en-US',
      title: config.default.site_name_en,
      description: config.default.description_en,
    },
    '/ja/': {
      lang: 'ja-JP',
      title: config.default.site_name_ja,
      description: config.default.description_ja,
    },
  },
  themeConfig: {
    repo: config.default.repo,
    repoLabel: 'Gitee',
    docsBranch: 'master',
    docsRepo: config.default.repo_docs,
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
      '/': {
        home: '/',
        selectLanguageName: '简体中文',
        selectLanguageText: '选择语言',
        selectLanguageAriaLabel: '选择语言',
        tip: '提示',
        warning: '警告',
        danger: '危险',
        notFound: ['找不到您要查找的页面。', '404 未找到该页面'],
        backToHome: '回到首页',
        openInNewWindow: '在新窗口中打开',
        lastUpdatedText: '更新时间',
        contributorsText: '参与贡献',
        editLinkText: '在 GitHub 上编辑该页',
        navbar: [
          {
            text: '反馈',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: '支持我们',
            children: [
              {
                text: '一次性赞助',
                link: './support-us.md',
              },
              {
                text: '周期性赞助',
                link: './support-us.md#%E5%91%A8%E6%9C%9F%E6%80%A7%E8%B5%9E%E5%8A%A9',
              },
            ],
          },
          {
            text: '了解更多',
            children: [
              {
                text: '更新内容',
                children: [
                  {
                    text: 'Web网页端',
                    link: 'https://support.qq.com/products/321980/blog/505810',
                  },
                  {
                    text: 'Unity客户端',
                    link: 'https://support.qq.com/products/321980/blog/505884',
                  },
                ],
              },
              {
                text: '法律相关',
                children: [
                  {
                    text: '免责声明',
                    link: './disclaimer.md',
                  },
                ],
              },
              {
                text: '其他',
                children: [
                  {
                    text: '加入讨论组',
                    link: './communication-group.md',
                  },
                  {
                    text: '下载客户端',
                    link: './download-client.md',
                  },
                  {
                    text: '加入我们',
                    link: './join.md',
                  },
                  {
                    text: '贡献指南',
                    link: './contributing.md',
                  },
                ],
              },
              {
                text: '鸣谢',
                children: [
                  {
                    text: '贡献鸣谢',
                    link: './contribution.md',
                  },
                  {
                    text: '赞助鸣谢',
                    link: './support-us.md#赞助鸣谢',
                  },
                  {
                    text: '技术鸣谢',
                    link: './credits.md',
                  },
                ],
              },
            ],
          },
        ],
      },
      '/en/': {
        home: '/en/',
        selectLanguageName: 'English',
        selectLanguageText: 'Language',
        selectLanguageAriaLabel: 'Language',
        lastUpdatedText: 'Last Updated',
        contributorsText: 'Contributors',
        tip: 'Tips',
        notFound: [
          'The page you’re looking for can’t be found.',
          '404 Not Found',
        ],
        backToHome: 'Back to home',
        openInNewWindow: 'open in new window',
        warning: 'Warning',
        danger: 'Danger',
        editLinkText: 'Edit this page on GitHub',
        navbar: [
          {
            text: 'Feedback',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: 'Support-Us',
            children: [
              {
                text: 'One Time Donation',
                link: './support-us.md',
              },
              {
                text: 'Weekly Donations',
                link: './support-us.md#weekly-donations',
              },
            ],
          },
          {
            text: 'Understand More',
            children: [
              {
                text: 'Update Content',
                children: [
                  {
                    text: 'WebPage',
                    link: 'https://support.qq.com/products/321980/blog/505810',
                  },
                  {
                    text: 'UnityClient',
                    link: 'https://support.qq.com/products/321980/blog/505884',
                  },
                ],
              },
              {
                text: 'Law Related',
                children: [
                  {
                    text: 'Disclaimer',
                    link: './disclaimer.md',
                  },
                ],
              },
              {
                text: 'Other',
                children: [
                  {
                    text: 'Download client',
                    link: './download-client.md',
                  },
                  {
                    text: 'Join us',
                    link: '/join.html',
                  },
                  {
                    text: 'Contributing Guide',
                    link: './contributing.md',
                  },
                ],
              },
              {
                text: 'Thanks',
                children: [
                  {
                    text: 'Contribution',
                    link: './contribution.md',
                  },
                  {
                    text: 'Sponsor',
                    link: './support-us.md',
                  },
                  {
                    text: 'Technical',
                    link: './credits.md',
                  },
                ],
              },
            ],
          },
        ],
      },
      '/ja/': {
        home: '/ja/',
        selectLanguageName: '日本語',
        selectLanguageText: '言語を選択',
        selectLanguageAriaLabel: '言語を選択',
        tip: 'ヒント',
        warning: '警告',
        danger: '危険',
        notFound: [
          'お探しのページが見つかりません。',
          '404 ページが見つかりません',
        ],
        backToHome: 'ホームページに戻る',
        openInNewWindow: '新しいウィンドウで開きます',
        lastUpdatedText: '最終更新',
        contributorsText: '貢献者',
        editLinkText: 'このページを編集',
        navbar: [
          {
            text: 'フィードバック',
            link: 'https://support.qq.com/products/321980',
          },
          {
            text: 'スポンサー',
            children: [
              {
                text: '1回限りのスポンサーシップ',
                link: './support-us.md',
              },
              {
                text: '定期的なスポンサーシップ',
                link: './support-us.md#weekly-donations',
              },
            ],
          },
          {
            text: 'もっと理解する',
            children: [
              {
                text: 'コンテンツを更新する',
                children: [
                  {
                    text: 'Webウェブページ',
                    link: 'https://support.qq.com/products/321980/blog/505810',
                  },
                  {
                    text: 'Unityクライアント',
                    link: 'https://support.qq.com/products/321980/blog/505884',
                  },
                ],
              },
              {
                text: '法律関係',
                children: [
                  {
                    text: '免責事項',
                    link: './disclaimer.md',
                  },
                ],
              },
              {
                text: 'その他',
                children: [
                  {
                    text: 'マップ クライアントをダウンロードする',
                    link: './download-client.md',
                  },
                  {
                    text: 'リクルート',
                    link: '/join.html',
                  },
                  {
                    text: '投稿ガイド',
                    link: './contributing.md',
                  },
                ],
              },
              {
                text: 'ありがとう',
                children: [
                  {
                    text: '貢献',
                    link: './contribution.md',
                  },
                  {
                    text: 'スポンサー',
                    link: './support-us.md',
                  },
                  {
                    text: 'テクニカル',
                    link: './credits.md',
                  },
                ],
              },
            ],
          },
        ],
      },
    },
  },
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        id: config.default.analytics_id,
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
        // hotKeys: ['s', '/'],
        locales: {
          '/en/': {
            placeholder: 'Search',
          },
          '/': {
            placeholder: '搜索',
          },
          '/ja/': {
            placeholder: '検索する',
          },
        },
      },
    ],
    // todo 等待什么时候可以白嫖了, 再解开封印
    // [
    //   '@vuepress/docsearch',
    //   {
    //     apiKey: '<API_KEY>',
    //     indexName: '<INDEX_NAME>',
    //     locales: {
    //       '/': {
    //         placeholder: 'Search',
    //       },
    //       '/zh/': {
    //         placeholder: '搜索',
    //       },
    //       '/ja/':{
    //         placeholder: '検索する',
    //       }
    //     },
    //   },
    // ],
    [
      '@vuepress/container',
      {
        type: 'tip',
        locales: {
          '/en/': {
            defaultInfo: 'Tips',
          },
          '/': {
            defaultInfo: '提示',
          },
          '/jp/': {
            defaultInfo: 'ヒント',
          },
        },
      },
    ],
    [
      '@vuepress/register-components',
      {
        componentsDir: path.resolve(__dirname, './docs/.vuepress/components'),
      },
    ],
    [
      'sitemap2',
      {
        hostname: config.default.host,
        exclude: [],
      },
    ],
    [
      'feed2',
      {
        hostname: config.default.host,
      },
    ],
    [
      'seo2',
      {
        author: config.default.author,
        twitterID: config.default.twitterID,
        restrictions: config.default.restrictions,
      },
    ],
    [
      'md-enhance',
      {
        enableAll: true,
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

    [
      'add-this',
      false,
      // {
      //   pubid: config.default.pubid,
      // },
    ],
    ['photo-swipe'],
    [
      'vuepress-plugin-lightgallery',
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
      '@vuepress/plugin-shiki',
      isProd
        ? {
            theme: 'github-dark', // 主题在线演示网址https://vscodethemes.com/
          }
        : false,
    ],
  ],
})
