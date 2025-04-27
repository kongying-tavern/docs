import type { Theme } from 'vitepress'
import Card from '@/components/Card.vue'
import Coins from '@/components/Coins.vue'
import * as components from '@/components/ui/'
import Layout from '@/layouts/Layout.vue'
import { MotionPlugin } from '@vueuse/motion'
import { match } from 'path-to-regexp'
import { createPinia } from 'pinia'
import { withBase } from 'vitepress'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import { markRaw } from 'vue'
import googleAnalytics from '../plugins/google-analytics'
import { routes } from '../routes'
import Forum from './layouts/Forum.vue'
import Headline from './layouts/Headline.vue'

import Post from './layouts/Post.vue'
import { getLangPath } from './utils'
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

    router.onBeforePageLoad = async (to) => {
      const locales = Object.keys(siteData.value.locales)
      const target = routes.find((route) => {
        if (route.i18n) {
          return locales.map(val => match(withBase(`${getLangPath(val)}${route.match}`))(to)).some(Boolean)
        }
        return match(withBase(route.match))(to)
      })

      if (!target)
        return true

      const { path, component } = target

      if (path) {
        router.route.path = path
      }
      else {
        router.route.path = to
      }

      router.route.component = markRaw(component)
      router.route.data = {
        relativePath: '',
        filePath: '',
        title: '',
        description: '',
        headers: [],
        frontmatter: { sidebar: false, layout: 'page' },
      }
      return false
    }
  },
} satisfies Theme
