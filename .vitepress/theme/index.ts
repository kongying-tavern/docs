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
      let matchedParams: Partial<Record<string, string | string[]>> = {}
      let target: typeof routes[number] | undefined

      for (const route of routes) {
        const matches = route.i18n
          ? locales.map(locale => match(withBase(`${getLangPath(locale)}${route.match}`))(to))
          : [match(withBase(route.match))(to)]

        const found = matches.find(Boolean)

        if (found) {
          matchedParams = found.params || {}
          target = route
          break
        }
      }

      if (!target)
        return true

      router.route.path = target.path || to
      router.route.component = markRaw(target.component)
      router.route.data = {
        relativePath: '',
        filePath: '',
        title: '',
        description: '',
        headers: [],
        params: matchedParams,
        frontmatter: { sidebar: false, layout: 'page' },
      }
      return false
    }
  },
} satisfies Theme
