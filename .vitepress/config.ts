import path from 'path'
import fs from 'fs'
import { defineConfig } from 'vitepress'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'

const base = (process.env.BASE || '/') as '/' | `/${string}/`
const isProd = process.env.NODE_ENV === 'production'
const hostname = 'https://yuanshen.site/docs-next/'
const commitRef = process.env.COMMIT_REF?.slice(0, 8) || 'dev'

export default defineConfig({
  lang: 'zh-Hans',
  title: '原神地图',
  description: '空荧酒馆制作的原神全资源攻略地图。',
  base: base,
  lastUpdated: true,
  srcDir: 'src',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: 'without-subfolders',

  locales: {
    '/': {
      lang: 'zh-CN',
      label: '简体中文',
    },
  },
  vue: {
    reactivityTransform: true,
  },

  themeConfig: {
    siteTitle: '原神地图',
    outlineTitle: 'ON THIS PAGE',

    lastUpdatedText: 'UPDATED DATE',

    nav: nav(),
    sidebar: [],
    editLink: {
      pattern: 'https://github.com/kongying-tavern/docs/edit/next/src/:path',
      text: '在 GitHub 编辑该页',
    },

    localeLinks: {
      text: '简体中文',
      items: [
        { text: 'English', link: '/' },
        { text: '日本語', link: '/' },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kongying-tavern/' },
      { icon: 'discord', link: 'https://discord.gg/aFe57AKZUF' },
      {
        icon: {
          svg: fs.readFileSync(
            path.resolve(__dirname, '../src/public/svg/qq-fill.svg'),
            'utf8'
          ),
        },
        link: '',
      },
    ],

    docFooter: {
      prev: '上一页',
      next: '下一页',
    },

    algolia: {
      appId: '8J64VVRP8K',
      apiKey: 'a18e2f4cc5665f6602c5631fd868adfd',
      indexName: 'vitepress',
    },
  },

  vite: {
    define: {},
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
      text: '问题反馈',
      link: 'https://support.qq.com/products/321980',
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
              link: 'https://support.qq.com/products/321980/blog/505884',
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
