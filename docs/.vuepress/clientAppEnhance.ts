import { usePageData, defineClientAppEnhance } from '@vuepress/client'
import {
  useThemeData,
  useThemeLocaleData,
} from '@vuepress/plugin-theme-data/lib/client'
import { log, isDEV, dayjs } from './utils'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import ElementPlus from 'element-plus'
import 'default-passive-events'
import './utils/date'

import type { PageData } from '@vuepress/client'
import type { ThemeData } from '@vuepress/plugin-theme-data'

import './styles/element-variables.scss'

type MyThemeData = ThemeData<{
  darkMode: boolean
  docsRepo: string
}>

export default defineClientAppEnhance(({ app, router, siteData }) => {
  const pageData = usePageData<PageData>()
  const themeData = useThemeData<MyThemeData>()
  app.use(ElementPlus, { locale })

  log('原神地图', 'DOCS', [
    {
      VuePressCore: __VERSION__,
      Vue: app.version,
      Title: siteData.value.title,
      Base: siteData.value.base,
      IsDark: themeData.value.darkMode,
      IsDEV: __DEV__,
      IsSSR: __SSR__,
      Current: dayjs(new Date()),
    },
  ])
  console.log(
    `%c🎉\u0020地图团队需要你的加入:\u0020https://yuanshen.site/docs/join.html`,
    'font-size:13px;'
  )

  isDEV(() => {
    console.log(app, router, siteData, pageData, themeData)
  })
})
