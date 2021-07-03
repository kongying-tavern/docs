import {
  useSiteData,
  usePageData,
  useRouteLocale,
  useSiteLocaleData,
  defineClientAppEnhance,
} from '@vuepress/client'
import { useThemeData } from '@vuepress/plugin-theme-data/lib/client'
import { log, isDEV } from './utils'
import ElementPlus from 'element-plus'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import './utils/date'

import type {
  PageData,
  SiteData,
  RouteLocale,
  SiteLocaleData,
} from '@vuepress/client'
import type { ThemeData } from '@vuepress/plugin-theme-data'

import './styles/element-variables.scss'

export default defineClientAppEnhance(async ({ app, router, siteData }) => {
  const pageData = usePageData<PageData>()
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
  isDEV(() => {
    console.log(app, router, siteData)
  })
})
