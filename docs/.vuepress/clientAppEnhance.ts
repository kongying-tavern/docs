import { usePageData, defineClientAppEnhance } from '@vuepress/client'
import { useThemeData } from '@vuepress/plugin-theme-data/lib/client'
import { log, isDEV, dayjs } from './utils'
import {
  useBrowserLocation,
  usePreferredLanguages,
  useNetwork,
  useWindowSize,
  usePreferredColorScheme,
  useDocumentVisibility,
  useDevicesList,
  useBattery,
} from '@vueuse/core'
import locale from 'element-plus/lib/locale/lang/zh-cn'
import ElementPlus from 'element-plus'
import 'default-passive-events'
import './styles/element-variables.scss'
import './utils/date'

import type { PageData } from '@vuepress/client'
import type { ThemeData } from '@vuepress/plugin-theme-data'

export default defineClientAppEnhance(({ app, router, siteData }) => {
  if (!__SSR__) {
    const location = useBrowserLocation()
    const languages = usePreferredLanguages()
    const preferredColor = usePreferredColorScheme()
    const visibility = useDocumentVisibility()
    const { isOnline, type } = useNetwork()
    const { width, height } = useWindowSize()
    const {
      devices,
      videoInputs: cameras,
      audioInputs: microphones,
      audioOutputs: speakers,
    } = useDevicesList()
    const { chargingTime, dischargingTime, level } = useBattery()
    console.log('Location:', location.value)
    console.log('Languages:', languages.value)
    console.log('PreferredColor:', preferredColor.value)
    console.log('Visibility:', visibility.value)
    console.log('IsOnline:', isOnline.value, '\nType:', type.value)
    console.log('ScreenWidth:', width.value, '\nScreenHeight:', height.value)
    console.log(
      'Devices:',
      devices.value,
      '\nVideoInputs:',
      cameras.value,
      '\nAudioInputs:',
      microphones.value,
      '\nAudioOutputs:',
      speakers.value
    )
    console.log(
      'ChargingTime:',
      chargingTime.value,
      '\nDischargingTime:',
      dischargingTime.value,
      '\nLevel:',
      level.value
    )
  }
  const pageData = usePageData<PageData>()
  const themeData = useThemeData<ThemeData>()
  app.use(ElementPlus, { locale })

  log('原神地图', 'DOCS', [
    {
      VuePressCore: __VERSION__,
      Vue: app.version,
      Title: siteData.value.title,
      Base: siteData.value.base,
      Mode: themeData.value.darkMode ? 'Dark' : 'Light',
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
    console.log(app, router, siteData)
  })
})
