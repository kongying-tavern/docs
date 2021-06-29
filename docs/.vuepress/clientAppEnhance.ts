import { defineClientAppEnhance } from '@vuepress/client'
import { usePageData, useRouteLocale } from '@vuepress/client'
import type { PageData, RouteLocale } from '@vuepress/client'
import { log } from './utils'
import ElementPlus from 'element-plus'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import './utils/date'
import './styles/element-variables.scss'

export default defineClientAppEnhance(async ({ app, router, siteData }) => {
  app.use(ElementPlus, { locale })
  log('原神地图', 'Docs', [
    {
      VuePressCore: globalThis.__VERSION__,
      VueVersion: app.version,
      isDEV: globalThis.__DEV__,
      isSSR: globalThis.__SSR__,
    },
  ])
  console.log(
    '🎉\u0020%c地图团队欢迎各位同学加入: https://yuanshen.site/docs/join.html',
    'font-size:13px;'
  )
  console.log(app, router, siteData)
})
