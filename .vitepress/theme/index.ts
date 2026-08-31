import type { Theme } from 'vitepress'
import { PiniaColada } from '@pinia/colada'
import { MotionPlugin } from '@vueuse/motion'
import { createPinia } from 'pinia'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import { defineAsyncComponent } from 'vue'
import Layout from '@/layouts/Layout.vue'
import googleAnalytics from '../plugins/google-analytics'
import { routes } from '../routes'
import { AsyncForumRouteView } from './components/AsyncForumRouteView'
import handleRouteMatching from './lib/handleRouteMatching'

import 'uno.css'

const pinia = createPinia()
const Blog = defineAsyncComponent(() => import('./layouts/Blog.vue'))
const Card = defineAsyncComponent(() => import('@/components/Card.vue'))
const Coins = defineAsyncComponent(() => import('@/components/Coins.vue'))
const Emoji = defineAsyncComponent(() => import('@/components/ui/Emoji.vue'))
const Forum = defineAsyncComponent(() => import('./layouts/Forum.vue'))
const Headline = defineAsyncComponent(() => import('./layouts/Headline.vue'))
const LinkGrid = defineAsyncComponent(() => import('@/components/ui/LinkGrid.vue'))
const Post = defineAsyncComponent(() => import('./layouts/Post.vue'))
const QQGroupList = defineAsyncComponent(() => import('@/components/QQGroupList.vue'))
const ScratchToReveal = defineAsyncComponent(() => import('@/components/ui/ScratchToReveal.vue'))
const SitemapPage = defineAsyncComponent(() => import('@/components/SitemapPage.vue'))

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
    app.use(PiniaColada)

    app.component('Coins', Coins)
    app.component('Card', Card)
    app.component('Emoji', Emoji)
    app.component('QQGroupList', QQGroupList)
    app.component('ScratchToReveal', ScratchToReveal)
    app.component('SitemapPage', SitemapPage)
    app.component('VPBadge', VPBadge)
    app.component('VPImage', VPImage)
    app.component('VPLink', VPLink)
    app.component('Headline', Headline)
    app.component('Post', Post)
    app.component('Forum', Forum)
    app.component('ForumRouteView', AsyncForumRouteView)
    app.component('Blog', Blog)
    app.component('LinkGrid', LinkGrid)

    router.onBeforePageLoad = async to => handleRouteMatching(to, siteData.value.base, routes, router, siteData.value.locales)
  },
} satisfies Theme
