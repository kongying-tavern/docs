import { usePageData, defineClientAppEnhance } from '@vuepress/client'
import { useThemeData } from '@vuepress/plugin-theme-data/lib/client'
import { log, isDEV } from './utils'
import ElementPlus from 'element-plus'
import 'default-passive-events'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import './utils/date'

import type { PageData } from '@vuepress/client'
import type { ThemeData } from '@vuepress/plugin-theme-data'

import './styles/element-variables.scss'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  const pageData = usePageData<PageData>()
  const themeData = useThemeData<ThemeData>()
  app.use(ElementPlus, { locale })

  log('原神地图', 'Docs', [
    {
      VuePressCore: __VERSION__,
      Vue: app.version,
      Title: siteData.value.title,
      Base: siteData.value.base,
      IsDEV: __DEV__,
      IsSSR: __SSR__,
    },
  ])
  console.log(
    '%c🎉\u0020地图团队欢迎各位同学加入:\u0020https://yuanshen.site/docs/join.html',
    'font-size:13px;'
  )
  isDEV(() => {
    console.log(app, router, siteData, pageData, themeData)
  })
})
