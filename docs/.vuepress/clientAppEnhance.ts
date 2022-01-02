import { usePageData, defineClientAppEnhance } from '@vuepress/client'
import { useThemeData } from '@vuepress/plugin-theme-data/lib/client'
import { log, isDEV, dayjs } from './utils'
import {
  usePreferredColorScheme,
  useOnline,
  useNetwork,
  useDevicePixelRatio,
  useWindowSize,
  useFullscreen,
} from '@vueuse/core'
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

  if (!__VUEPRESS_SSR__) {
    const preferredColor = usePreferredColorScheme()
    const online = useOnline()
    const { isFullscreen } = useFullscreen()
    const { width, height } = useWindowSize()
    const { pixelRatio } = useDevicePixelRatio()
    const { type } = useNetwork()
    log('原神地图', 'DOCS', [
      {
        VuePressCore: __VUEPRESS_VERSION__,
        Vue: app.version,
        Base: siteData.value.base,
        Online: online.value,
        PreferredColor: preferredColor.value,
        NetworkType: type.value || 'unknown',
        PixelRatio: pixelRatio.value,
        IsFullscreen: isFullscreen.value,
        WindowSize: `${width.value} * ${height.value}`,
        IsDEV: __VUEPRESS_DEV__,
        CurrentUTC: dayjs().utc().format('YYYY-MM-DD LT'),
      },
    ])
  }

  app.use(ElementPlus, { locale })

  console.log(
    `%c✨\u0020技术宅拯救世界:\u0020https://yuanshen.site/docs/join.html`,
    'font-size:13px;'
  )

  isDEV(() => {
    console.log(app, router, siteData)
  })
})
