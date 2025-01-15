import Card from '@/components/Card.vue'
import Coins from '@/components/Coins.vue'
import * as components from '@/components/ui/'
import Layout from '@/layouts/Layout.vue'
import { createPinia } from 'pinia'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import googleAnalytics from '../plugins/google-analytics'

import type { Theme } from 'vitepress'

import 'uno.css'
import HeadlinePage from './layouts/HeadlinePage.vue'

const pinia = createPinia()

export default {
  ...DefaultTheme,
  Layout,

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
    app.component('Headline', HeadlinePage)

    for (const component of Object.keys(
      components,
    ) as (keyof typeof components)[])
      app.component(component, components[component])
  },
} satisfies Theme
