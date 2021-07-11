import { defineUserConfig } from 'vuepress'
import { CONFIG } from './config'
import { path } from '@vuepress/utils'

import type { ViteBundlerOptions } from 'vuepress-vite'
import type { DefaultThemeOptions } from 'vuepress'

const rootPath = CONFIG.HOST + CONFIG.PATH
const isProd = process.env.NODE_ENV === 'production'

console.log('Mode:', isProd ? 'Production' : 'development')

interface myOptions extends DefaultThemeOptions {
  feed?: '反馈'
}

module.exports = defineUserConfig<myOptions, ViteBundlerOptions>({
  bundler: '@vuepress/webpack',
  bundlerConfig: {},
  dest: 'dist',
  public: 'public',
  base: CONFIG.PATH,
  theme: path.resolve(__dirname, './docs/.vuepress/theme/'),
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
    ['meta', { name: 'renderer', content: CONFIG.RENDERER }],
    ['meta', { name: 'force-rendering', content: CONFIG.RENDERER }],
    ['meta', { name: 'applicable-device', content: 'pc,mobile' }],
    ['meta', { name: 'msapplication-titleColor', content: CONFIG.THEME_COLOR }],
    [
      'meta',
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'lack-translucent',
      },
    ],
    ['meta', { name: 'apple-mobile-web-app-capable', content: 'yes' }],
    ['meta', { name: 'apple-mobile-web-app-title', content: CONFIG.SITE_NAME }],
    ['meta', { name: 'format-detection', content: 'telephone=no' }],
    ['meta', { name: 'google', content: 'notranslate' }],
    ['meta', { name: 'twitter:image', content: CONFIG.COVER }],
    ['meta', { itemprop: 'image', content: CONFIG.COVER }],
    ['link', { rel: 'manifest', href: CONFIG.PATH + '/manifest.webmanifest' }],
    ['link', { rel: 'apple-touch-icon', href: CONFIG.APP_TOUCH_ICON }],
    ['link', { rel: 'shortcut icon', href: CONFIG.FAVICON }],
    [
      'link',
      {
        rel: 'mask-icon',
        href: rootPath + CONFIG.MASK_ICON,
        color: CONFIG.THEME_COLOR,
      },
    ],
    [
      'script',
      {
        crossOrigin: 'anonymous',
        src: 'https://at.alicdn.com/t/font_2601360_fm2bv1j1zqf.js',
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
      title: CONFIG.SITE_NAME,
      description: CONFIG.DESCRIPTION,
    },
    '/en/': {
      lang: 'en-US',
      title: CONFIG.SITE_NAME_EN,
      description: CONFIG.DESCRIPTION_EN,
    },
    '/ja/': {
      lang: 'ja-JP',
      title: CONFIG.DESCRIPTION_JA,
      description: CONFIG.DESCRIPTION_JA,
    },
  },
  themeConfig: {
    repo: CONFIG.REPO,
    repoLabel: 'Gitee',
    docsBranch: 'master',
    docsRepo: CONFIG.REPO_DOCS,
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
        download: '下载',
        newFolder: '新建文件夹',
        grade: '以上内容对您是否有帮助？',
        selectDownloadMethod: '选择下载方式',
        feedback: '反馈',
        thankFeedback: '感谢您的反馈！',
        stayTuned: '敬请期待',
        followUs: '关注我们',
        notFound: ['找不到您要查找的页面。', '404 未找到该页面'],
        backToHome: '回到首页',
        backToTop: '回到顶部',
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
                link: '/support-us.md',
              },
              {
                text: '周期性赞助',
                link: '/support-us.md#%E5%91%A8%E6%9C%9F%E6%80%A7%E8%B5%9E%E5%8A%A9',
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
                    link: '/disclaimer.md',
                  },
                  {
                    text: '隐私政策',
                    link: '/privacy.md',
                  },
                  {
                    text: '用户协议',
                    link: '/agreement.md',
                  },
                ],
              },
              {
                text: '其他',
                children: [
                  {
                    text: '加入讨论组',
                    link: '/communication-group.md',
                  },
                  {
                    text: '下载客户端',
                    link: '/download-client.md',
                  },
                  {
                    text: '加入我们',
                    link: '/join.md',
                  },
                  {
                    text: '贡献指南',
                    link: '/contributing.md',
                  },
                ],
              },
              {
                text: '鸣谢',
                children: [
                  {
                    text: '贡献鸣谢',
                    link: '/contribution.md',
                  },
                  {
                    text: '赞助鸣谢',
                    link: '/support-us.md#赞助鸣谢',
                  },
                  {
                    text: '技术鸣谢',
                    link: '/credits.md',
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
        download: 'download',
        newFolder: 'New folder',
        followUs: 'Follow us',
        stayTuned: 'Stay tuned',
        grade: 'Did the above content help you?',
        feedback: 'Feedback',
        thankFeedback: 'Thanks for your feedback!',
        tip: 'Tips',
        notFound: [
          'The page you’re looking for can’t be found.',
          '404 Not Found',
        ],
        backToHome: 'Back to home',
        backToTop: 'Back to top',
        openInNewWindow: 'open in new window',
        warning: 'Warning',
        danger: 'Danger',
        selectDownloadMethod: 'Select download method',
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
                link: '/en/support-us.md',
              },
              {
                text: 'Weekly Donations',
                link: '/en/support-us.md#weekly-donations',
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
                    link: '/en/disclaimer.md',
                  },
                  {
                    text: 'Privacy',
                    link: '/en/privacy.md',
                  },
                  {
                    text: 'User Agreement',
                    link: '/en/agreement.md',
                  },
                ],
              },
              {
                text: 'Other',
                children: [
                  {
                    text: 'Download client',
                    link: '/en/download-client.md',
                  },
                  {
                    text: 'Join us',
                    link: '/join.html',
                  },
                  {
                    text: 'Contributing Guide',
                    link: '/en/contributing.md',
                  },
                ],
              },
              {
                text: 'Thanks',
                children: [
                  {
                    text: 'Contribution',
                    link: '/en/contribution.md',
                  },
                  {
                    text: 'Sponsor',
                    link: '/en/support-us.md',
                  },
                  {
                    text: 'Credits',
                    link: '/en/credits.md',
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
        download: 'ダウンロード',
        newFolder: '新しいフォルダ',
        grade: '上記はあなたを助けることができますか？',
        followUs: 'フォローする',
        feedback: 'フィードバック',
        thankFeedback: 'ご意見ありがとうございます！',
        stayTuned: '乞うご期待',
        selectDownloadMethod: 'ダウンロード方法を選択してください',
        notFound: [
          'お探しのページが見つかりません。',
          '404 ページが見つかりません',
        ],
        backToHome: 'ホームページに戻る',
        backToTop: 'トップに戻る',
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
                link: '/ja/support-us.md',
              },
              {
                text: '定期的なスポンサーシップ',
                link: '/ja/support-us.md#weekly-donations',
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
                    link: '/ja/disclaimer.md',
                  },
                  {
                    text: 'プライバシー',
                    link: '/ja/privacy.md',
                  },
                  {
                    text: 'ユーザー規約',
                    link: '/ja/agreement.md',
                  },
                ],
              },
              {
                text: 'その他',
                children: [
                  {
                    text: 'マップ クライアントをダウンロードする',
                    link: '/ja/download-client.md',
                  },
                  {
                    text: 'リクルート',
                    link: '/join.html',
                  },
                  {
                    text: '投稿ガイド',
                    link: '/ja/contributing.md',
                  },
                ],
              },
              {
                text: 'ありがとう',
                children: [
                  {
                    text: '貢献',
                    link: '/ja/contribution.md',
                  },
                  {
                    text: 'スポンサー',
                    link: '/ja/support-us.md',
                  },
                  {
                    text: 'テクニカル',
                    link: '/ja/credits.md',
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
        id: CONFIG.ANALYTICS_ID,
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
    // todo
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
        hostname: CONFIG.HOST,
        exclude: [],
      },
    ],
    [
      'feed2',
      false,
      //       {
      //         hostname: CONFIG.host,
      //       },
    ],
    [
      'seo2',
      {
        author: CONFIG.AUTHOR,
        twitterID: CONFIG.TWITTER_ID,
        restrictions: CONFIG.RESTRICTIONS,
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
      '@vuepress/plugin-shiki',
      isProd
        ? {
            theme: 'github-dark', // 主题在线演示网址https://vscodethemes.com/
          }
        : false,
    ],
  ],
})
