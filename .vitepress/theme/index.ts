import { createPinia } from 'pinia'
import { useRoute, withBase } from 'vitepress'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import { defineAsyncComponent, h, nextTick, onMounted, watch } from 'vue'
import mediumZoom from 'medium-zoom'
import googleAnalytics from '../plugins/google-analytics'
import Card from './components/Card.vue'
import Coins from './components/Coins.vue'
import DocAside from './components/DocAside.vue'
import NavBarUserAvatar from './components/NavBarUserAvatar.vue'
import DocFeedback from './components/DocFeedback.vue'
import DocHeader from './components/DocHeader.vue'
import DocInfo from './components/DocInfo.vue'
import { Sonner } from '@/components/ui/sonner'
import HighlightTargetedHeading from './components/HighlightTargetedHeading.vue'
import * as components from './components/ui/'

import type { Theme } from 'vitepress'

import 'uno.css'
import './styles/vars.css'
import './styles/main.css'
import './styles/ui.css'
import './styles/timeline.css'
import './styles/kbd.css'
import './styles/animation.css'
import './styles/shadcn.css'

const pinia = createPinia()

export default {
  ...DefaultTheme,

  Layout() {
    return h(DefaultTheme.Layout, null, {
      'layout-top': () =>
        h(defineAsyncComponent(async () => import('./components/Banner.vue'))),
      'nav-bar-title-before': () => h(Sonner),
      'layout-bottom': () => h(HighlightTargetedHeading),
      'doc-before': () => h(DocHeader),
      'doc-footer-before': () => h(DocInfo),
      'doc-after': () => h(DocFeedback),
      'nav-bar-content-after': () => h(NavBarUserAvatar),
      'aside-outline-after': () => h(DocAside),
    })
  },
  enhanceApp({ app }) {
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
    app.use(pinia)
    app.component('Coins', Coins)
    app.component('Card', Card)
    app.component('VPBadge', VPBadge)
    app.component('VPImage', VPImage)
    app.component('VPLink', VPLink)

    for (const component of Object.keys(
      components,
    ) as (keyof typeof components)[])
      app.component(component, components[component])
  },
  setup() {
    const route = useRoute()

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

  // @ts-ignore
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
