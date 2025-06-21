import type { Theme } from 'vitepress'
import Card from '@/components/Card.vue'
import Coins from '@/components/Coins.vue'
import * as components from '@/components/ui/'
import Layout from '@/layouts/Layout.vue'
import { MotionPlugin } from '@vueuse/motion'
import { createPinia } from 'pinia'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import googleAnalytics from '../plugins/google-analytics'
import { routes } from '../routes'
import Forum from './layouts/Forum.vue'
import Headline from './layouts/Headline.vue'
import Post from './layouts/Post.vue'
import handleRouteMatching from './lib/handleRouteMatching'

import 'uno.css'

const pinia = createPinia()

export default {
  ...DefaultTheme,
  Layout,

  enhanceApp({ app, router, siteData }) {
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })

    app.use(pinia)
    app.use(MotionPlugin)

    app.component('Coins', Coins)
    app.component('Card', Card)
    app.component('VPBadge', VPBadge)
    app.component('VPImage', VPImage)
    app.component('VPLink', VPLink)
    app.component('Headline', Headline)
    app.component('Post', Post)
    app.component('Forum', Forum)

    for (const component of Object.keys(
      components,
    ) as (keyof typeof components)[])
      app.component(component, components[component])

    router.onBeforePageLoad = async to => handleRouteMatching(to, siteData.value.base, routes, router, siteData.value.locales)
  },
} satisfies Theme
