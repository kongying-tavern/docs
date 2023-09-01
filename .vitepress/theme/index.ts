import {
  onMounted,
  watch,
  nextTick,
  defineAsyncComponent,
  h,
  watchEffect,
} from 'vue'
import { useRoute, inBrowser, useData } from 'vitepress'
import mediumZoom from 'medium-zoom'
import DefaultTheme from 'vitepress/theme-without-fonts'
import Link from './components/Link.vue'
import Coins from './components/Coins.vue'
import googleAnalytics from '../plugins/googleAnalytics'
import Card from '../theme/components/Card'
import LinkGrid from '../theme/components/LinkGrid.vue'
import { createI18n } from 'vue-i18n'
import 'uno.css'
import './styles/vars.css'
import './styles/main.css'

export default {
  ...DefaultTheme,

  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () =>
        h(defineAsyncComponent(() => import('./components/Banner.vue'))),
    })
  },
  enhanceApp({ app }) {
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
    const i18n = createI18n({
      legacy: false,
      locale: 'zh-CN',
      fallbackLocale: '',
    })
    app.component('Link', Link)
    app.component('Coins', Coins)
    app.component('VPCard', Card)
    app.component('LinkGrid', LinkGrid)
  },
  setup() {
    const route = useRoute()
    const { lang } = useData()
    const initZoom = () => {
      mediumZoom('.main img:not(.no-zoomable)', {
        background: 'var(--vp-c-bg)',
      })
    }
    onMounted(() => {
      initZoom()
    })
    watch(
      () => route.path,
      () =>
        nextTick(() => {
          initZoom()
        }),
    )
    watchEffect(() => {
      if (inBrowser) {
        document.cookie = `nf_lang=${lang.value}; expires=Mon, 1 Jan 2024 00:00:00 UTC; path=/`
      }
    })
  },
}
