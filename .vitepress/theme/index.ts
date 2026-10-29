import type { Theme } from 'vitepress'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import { defineAsyncComponent, ref } from 'vue'
import Blog from '@/layouts/Blog.vue'
import Layout from '@/layouts/Layout.vue'
import SettingsPage from '~/components/settings/SettingsPage.vue'
import { useForumTranslationPreferences } from '~/forum/composables/data/useForumTranslationPreferences'
import { useForumViewMode } from '~/forum/composables/state/useForumViewMode'
import { installTelemetry } from '~/services/telemetry'
import googleAnalytics from '../plugins/google-analytics'
import { AsyncForumRouteView } from './components/AsyncForumRouteView'
import { forumStartupKey } from './components/forumStartup'
import { installI18n, setupI18n } from './i18n'
import { loadFontStylesheets } from './loadFontStylesheets'
import { loadForumLayout, useForumLinkPreload } from './router/forumPreload'
import { installThemeRouter } from './router/installThemeRouter'

import 'uno.css'

const pinia = createPinia()
const AccordionPanels = defineAsyncComponent(() => import('@/components/ui/AccordionPanels.vue'))
const Card = defineAsyncComponent(() => import('@/components/Card.vue'))
const Coins = defineAsyncComponent(() => import('@/components/Coins.vue'))
const Emoji = defineAsyncComponent(() => import('@/components/ui/Emoji.vue'))
const Forum = defineAsyncComponent(loadForumLayout)
const Headline = defineAsyncComponent(() => import('./layouts/Headline.vue'))
const LinkGrid = defineAsyncComponent(() => import('@/components/ui/LinkGrid.vue'))
const Post = defineAsyncComponent(() => import('./layouts/Post.vue'))
const Settings = defineAsyncComponent(() => import('./layouts/Settings.vue'))
const ForumLabelAdminPage = defineAsyncComponent(() => import('~/forum/components/settings/ForumLabelAdminPage.vue'))
const QQGroupList = defineAsyncComponent(() => import('@/components/QQGroupList.vue'))
const ScratchToReveal = defineAsyncComponent(() => import('@/components/ui/ScratchToReveal.vue'))
const SitemapPage = defineAsyncComponent(() => import('@/components/SitemapPage.vue'))

export default {
  extends: DefaultTheme,
  Layout,

  setup() {
    setupI18n()
    useForumLinkPreload()
  },

  enhanceApp({ app, router, siteData }) {
    installI18n(app)
    const initialDocument = ref(true)
    app.provide(forumStartupKey, initialDocument)
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })

    installTelemetry(app)

    app.use(pinia)
    app.use(PiniaColada)
    if (!import.meta.env.SSR) {
      // Persistent watchers must not inherit the first topic component's instance.
      app.runWithContext(() => {
        useForumTranslationPreferences()
        useForumViewMode()
      })
    }

    app.component('AccordionPanels', AccordionPanels)
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
    app.component('Settings', Settings)
    app.component('SettingsPage', SettingsPage)
    app.component('ForumLabelAdminPage', ForumLabelAdminPage)
    app.component('Forum', Forum)
    app.component('ForumRouteView', AsyncForumRouteView)
    app.component('Blog', Blog)
    app.component('LinkGrid', LinkGrid)

    if (!import.meta.env.SSR) {
      loadFontStylesheets()
    }

    installThemeRouter(router, siteData, initialDocument)
  },
} satisfies Theme
