import path from 'path'
import fs from 'fs'
import Unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Inspect from 'vite-plugin-inspect'
import { defineConfig, HeadConfig } from "vitepress";

const base = (process.env.BASE || '/docs/') as '/docs/' | `/${string}/`
const isProd = process.env.NODE_ENV === 'production'
const commitRef = process.env.COMMIT_REF?.slice(0, 8) || 'dev'

export const sharedConfig = defineConfig({
  lang: 'zh-Hans',
  title: '原神地图',
  description: '空荧酒馆制作的原神全资源攻略地图。',
  base: base,
  lastUpdated: true,
  srcDir: 'src',
  srcExclude: [],
  scrollOffset: 'header',
  cleanUrls: true,
  
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
  head: head,
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
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档',
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
          },
        },
      },
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

const head: HeadConfig[] = [
  ["meta", { name: "theme-color", content: "#ffffff" }],
  [
    "link",
    {
      rel: "icon",
      href: "./imgs/favicon-32x32.png",
      type: "image/png",
    },
  ],
  [
    "link",
    {
      rel: "icon",
      href: "./imgs/favicon.ico",
      type: "image/x-icon",
    },
  ],
  ["meta", { name: "author", content: "@Arrebol" }],
  [
    "meta",
    { property: "og:image", content: "https://yuanshen.site/imgs/cover.jpg" },
  ],
  ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ["meta", { name: "twitter:creator", content: "@KongyingTavern" }],
  [
    "meta",
    {
      name: "twitter:image",
      content: "https://yuanshen.site/imgs/cover.jpg",
    },
  ],
  [
    "meta",
    {
      name: "viewport",
      content:
        "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover",
    },
  ],
];
