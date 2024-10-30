import mediumZoom from 'medium-zoom'
import { createPinia } from 'pinia'
import type { Theme } from 'vitepress'
import { useData, useRoute, withBase } from 'vitepress'
import DefaultTheme, { VPBadge } from 'vitepress/theme-without-fonts'
import { defineAsyncComponent, h, nextTick, onMounted, watch } from 'vue'
import googleAnalytics from '../plugins/google-analytics'
import Card from './components/Card.vue'
import Coins from './components/Coins.vue'
import DocAside from './components/DocAside.vue'
import DocFeedback from './components/DocFeedback.vue'
import DocHeader from './components/DocHeader.vue'
import DocInfo from './components/DocInfo.vue'
import HighlightTargetedHeading from './components/HighlightTargetedHeading.vue'
import Link from './components/Link.vue'
import LinkGrid from './components/LinkGrid.vue'

import 'uno.css'
import './styles/vars.css'
import './styles/main.css'
import './styles/ui.css'
import './styles/timeline.css'
import './styles/kbd.css'
import './styles/animation.css'

const pinia = createPinia()

export default {
  ...DefaultTheme,

  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () =>
        h(defineAsyncComponent(async () => import('./components/Banner.vue'))),
      'layout-bottom': () => h(HighlightTargetedHeading),
      'doc-before': () => h(DocHeader),
      'doc-footer-before': () => h(DocInfo),
      'doc-after': () => h(DocFeedback),
      // 'aside-outline-after': () => h(DocAside),
    })
  },
  enhanceApp({ app }) {
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
    app.use(pinia)
    app.component('Link', Link)
    app.component('Coins', Coins)
    app.component('Card', Card)
    app.component('LinkGrid', LinkGrid)
    app.component('Badge', VPBadge)
  },
  setup() {
    const route = useRoute()
    const { lang } = useData()

    onMounted(() => {
      initZoom()
      loadFont()
    })
    watch(
      () => route.path,
      async () =>
        nextTick(() => {
          initZoom()
        }),
    )
  },
} satisfies Theme

const loadFont = () => {
  const font = new FontFace(
    'zh-cn-full',
    `url(${withBase('/fonts/HYWenHei-85W-zh-full.woff2')})`,
    {
      display: 'swap',
    },
  )

  document.fonts.add(font)

  font.load().then((e) => {
    document.documentElement.classList.toggle('font-full')
  })
}

const initZoom = () => {
  mediumZoom('.main img:not(.no-zoomable)', {
    background: 'var(--vp-c-bg)',
  })
}
