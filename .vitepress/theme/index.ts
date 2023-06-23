import { onMounted, watch, nextTick, defineAsyncComponent, h } from 'vue'
import { useRoute, inBrowser } from 'vitepress'
import mediumZoom from 'medium-zoom'
import DefaultTheme from 'vitepress/theme-without-fonts'
import Link from './components/Link.vue'
import Coins from './components/Coins.vue'
import AutoJump from './components/AutoJump.vue'
import googleAnalytics from '../plugins/googleAnalytics'
import Card from '../theme/components/Card'
import 'uno.css'
import './styles/vars.css'
import './styles/main.css'

export default {
  ...DefaultTheme,

  Layout() {
    return h(DefaultTheme.Layout, null, {
      'doc-after': () =>
        h(defineAsyncComponent(() => import('./components/Giscus.vue'))),
    })
  },
  enhanceApp({ app }) {
    app.component('Link', Link)
    app.component('Coins', Coins)
    app.component('AutoJump', AutoJump)
    app.component('VPCard', Card)
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
  },
  setup() {
    const route = useRoute()
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
        })
    )
  },
}
