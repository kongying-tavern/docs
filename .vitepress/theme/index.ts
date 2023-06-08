import { onMounted, watch, nextTick, h } from 'vue'
import { useRoute, inBrowser } from 'vitepress'
import { setupRouterScroller } from 'vue-router-better-scroller'
import mediumZoom from 'medium-zoom'
import Theme from 'vitepress/theme-without-fonts'
import Link from './components/Link.vue'
import Coins from './components/Coins.vue'
import AutoJump from './components/AutoJump.vue'
import googleAnalytics from '../plugins/googleAnalytics'
import Card from '../theme/components/Card'

import 'uno.css'
import './styles/vars.css'
import './styles/main.css'

export default {
  ...Theme,

  Layout() {
    return h(Theme.Layout, null, {})
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
    if (!inBrowser) {
      const route = useRoute()
      const html = document.querySelector('html')!
      setupRouterScroller(route, {
        selectors: {
          body(ctx) {
            // only do the sliding transition when the scroll position is not 0
            if (ctx.savedPosition?.top) html.classList.add('no-sliding')
            else html.classList.remove('no-sliding')
            return true
          },
        },
      })
    }
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

          document.querySelector('#VPContent')?.classList.toggle('slide-enter')
          setTimeout(() => {
            document
              .querySelector('#VPContent')
              ?.classList.toggle('slide-enter')
          }, 1000)
        })
    )
  },
}
