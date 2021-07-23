import { usePageData, defineClientAppEnhance } from '@vuepress/client'
import { useThemeData } from '@vuepress/plugin-theme-data/lib/client'
import { log, isDEV, dayjs } from './utils'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import ElementPlus from 'element-plus'
import 'default-passive-events'
import './styles/element-variables.scss'
import './utils/date'

import type { PageData } from '@vuepress/client'
import type { ThemeData } from '@vuepress/plugin-theme-data'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  const pageData = usePageData<PageData>()
  const themeData = useThemeData<ThemeData>()
  if (!__SSR__) {
    log('原神地图', 'DOCS', [
      {
        VuePressCore: __VERSION__,
        Vue: app.version,
        Title: siteData.value.title,
        Base: siteData.value.base,
        Mode: themeData.value.darkMode ? 'Dark' : 'Light',
        IsDEV: __DEV__,
        IsSSR: __SSR__,
        Current: dayjs(new Date()).local(),
      },
    ])
  }

  app.use(ElementPlus, { locale })

  console.log(
    `%c🎉\u0020地图团队需要你的加入:\u0020https://yuanshen.site/docs/join.html`,
    'font-size:13px;'
  )

  isDEV(() => {
    console.log(app, router, siteData)
  })
})
