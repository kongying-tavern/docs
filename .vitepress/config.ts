import path from 'path'
import fs from 'fs'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { SearchPlugin } from 'vitepress-plugin-search'
import Inspect from 'vite-plugin-inspect'
import { defineConfig, withBase } from 'vitepress'
import { Segment } from 'segment'
const base = (process.env.BASE || '/docs/') as '/docs/' | `/${string}/`
const isProd = process.env.NODE_ENV === 'production'
const commitRef = process.env.COMMIT_REF?.slice(0, 8) || 'dev'
const segment = new Segment()
// 使用默认的识别模块及字典，载入字典文件需要1秒，仅初始化时执行一次即可
segment.useDefault()

export default defineConfig({
  lang: 'zh-Hans',
  title: '原神地图',
  description: '空荧酒馆制作的原神全资源攻略地图。',
  base: base,
  lastUpdated: true,
  srcDir: 'src',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
    },
    en: {
      label: 'English',
      lang: 'fr',
      link: '/en/',
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      link: '/ja/',
    },
  },
  vue: {
    reactivityTransform: true,
  },
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
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
    [
      'link',
      {
        rel: 'icon',
        href: withBase('/imgs/favicon-32x32.png'),
        type: 'image/png',
      },
    ],
    [
      'link',
      {
        rel: 'icon',
        href: withBase('/imgs/favicon.ico'),
        type: 'image/x-icon',
      },
    ],
    ['meta', { name: 'author', content: '@Arrebol' }],
    ['meta', { property: 'og:title', content: '原神地图' }],
    [
      'meta',
      { property: 'og:image', content: 'https://yuanshen.site/imgs/cover.jpg' },
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: '空荧酒馆制作的原神全资源攻略地图。',
      },
    ],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:creator', content: '@KongyingTavern' }],
    [
      'meta',
      {
        name: 'twitter:image',
        content: 'https://yuanshen.site/imgs/cover.jpg',
      },
    ],
    [
      'meta',
      {
        name: 'viewport',
        content:
          'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover',
      },
    ],
  ],
  themeConfig: {
    siteTitle: '原神地图',
    outlineTitle: 'ON THIS PAGE',
    logo: '/imgs/logo_256.png',
    lastUpdatedText: '更新日期',

    nav: nav(),
    sidebar: [],
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/next/src/:path',
      text: '报告错误',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern/' },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      { icon: 'twitter', link: 'https://twitter.com/KongyingTavern' },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, '../src/public/svg/qq-fill.svg'),
            'utf8'
          ),
        },
        link: 'https://qm.qq.com/cgi-bin/qm/qr?k=qDLY3l2-A_zf2AW73X5S5PHuHcjicVbf&jump_from=webapi',
      },
    ],

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
  },

  vite: {
    // define: {
    //   __DATE__: `'${new Date().toISOString()}'`,
    //   __COMMIT_REF__: commitRef,
    //   __ISPROD__: isProd
    // },
    server: {
      host: true,
      fs: {
        allow: ['../..'],
      },
    },
    plugins: [
      // https://github.com/antfu/unocss
      Unocss(),

      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
        imports: ['vue', '@vueuse/core'],
        dts: './auto-imports.d.ts',
        vueTemplate: true,
      }),

      SearchPlugin({
        //@ts-ignore
        encode: function (str) {
          return segment.doSegment(str, { simple: true })
        },
        tokenize: 'forward',
      }),
      Inspect(),
    ],
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: Infinity,
    },
    json: {
      stringify: true,
    },
  },
})

function nav() {
  return [
    {
      text: '帮助和反馈',
      items: [
        {
          text: '客户端使用手册',
          link: 'https://support.qq.com/products/321980/faqs-more/?id=94938',
        },
        {
          text: '问题反馈',
          link: 'https://support.qq.com/products/321980',
        },
        {
          text: '功能介绍',
          link: 'https://support.qq.com/products/321980/faqs-more/?id=126362',
        },
        {
          text: '功能投票',
          link: 'https://support.qq.com/products/321980/topic-detail/2016/',
        },
      ],
    },
    {
      text: '加入社区',
      link: '/community.md',
    },
    {
      text: '了解更多',
      items: [
        {
          text: '了解我们',
          items: [
            {
              text: '加入我们',
              link: '/join.md',
            },
            {
              text: '了解团队',
              link: '/team.md',
            },
          ],
        },
        {
          text: '更新日志',
          items: [
            {
              text: '网页端',
              link: 'https://support.qq.com/products/321980/blog/505810',
            },
            {
              text: '客户端',
              link: 'https://support.qq.com/products/321980/blog/772498',
            },
          ],
        },
        {
          text: '鸣谢',
          items: [
            {
              text: '技术鸣谢',
              link: '/credits.md',
            },
            {
              text: '贡献鸣谢',
              link: '/contribution.md',
            },
            {
              text: '赞助鸣谢',
              link: '/support-us.md#赞助鸣谢',
            },
          ],
        },
        {
          text: '法律相关',
          items: [
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
      ],
    },
    {
      text: '支持我们',
      items: [
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
  ]
}
