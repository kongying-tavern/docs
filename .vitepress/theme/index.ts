import type { Theme } from 'vitepress'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import DefaultTheme, {
  VPBadge,
  VPImage,
  VPLink,
} from 'vitepress/theme-without-fonts'
import { defineAsyncComponent, ref } from 'vue'
import SettingsPage from '@/src/features/settings/SettingsPage.vue'
import { useForumTranslationPreferences } from '@/src/forum/composables/data/useForumTranslationPreferences.ts'
import { useForumViewMode } from '@/src/forum/composables/state/useForumViewMode.ts'
import { installTelemetry } from '@/src/services/telemetry/index.ts'
import googleAnalytics from '../plugins/google-analytics/index.ts'
import { forumStartupKey } from './components/forum/index.ts'
import { Kbd, KbdGroup } from './components/ui/kbd/index.ts'
import { KeyboardShortcut } from './components/ui/keyboard-shortcut/index.ts'
import { installI18n, interfaceLocaleForHref, setupI18n } from './i18n/index.ts'
import Blog from './layouts/Blog.vue'
import Layout from './layouts/Layout.vue'
import { loadFontStylesheets } from './lib/fontStylesheets.ts'
import { AsyncForumRouteView } from './router/asyncForumRouteView.ts'
import { loadForumLayout, useForumLinkPreload } from './router/forumPreload.ts'
import { installThemeRouter } from './router/installThemeRouter.ts'

import 'uno.css'

const pinia = createPinia()
// Async entries point at the SFC itself: a directory barrel would also load the
// sibling exports into the same chunk.
const AccordionPanels = defineAsyncComponent(() => import('./components/ui/accordion/AccordionPanels.vue'))
const Card = defineAsyncComponent(() => import('./markdown-ext/card/Card.vue'))
const Coins = defineAsyncComponent(() => import('./components/coins/Coins.vue'))
const Emoji = defineAsyncComponent(() => import('./components/ui/emoji/Emoji.vue'))
const Forum = defineAsyncComponent(loadForumLayout)
const Headline = defineAsyncComponent(() => import('./layouts/Headline.vue'))
const LinkGrid = defineAsyncComponent(() => import('./components/ui/link-grid/LinkGrid.vue'))
const Post = defineAsyncComponent(() => import('./layouts/Post.vue'))
const Settings = defineAsyncComponent(() => import('./layouts/Settings.vue'))
const ForumLabelAdminPage = defineAsyncComponent(() => import('@/src/forum/components/settings/ForumLabelAdminPage.vue'))
const QA = defineAsyncComponent(() => import('./markdown-ext/qa/QA.vue'))
const QQGroupList = defineAsyncComponent(() => import('./components/qq-group-list/QQGroupList.vue'))
const Spoiler = defineAsyncComponent(() => import('./markdown-ext/spoiler/Spoiler.vue'))
const SitemapPage = defineAsyncComponent(() => import('./components/sitemap-page/SitemapPage.vue'))

export default {
  extends: DefaultTheme,
  Layout,

  setup() {
    setupI18n()
    useForumLinkPreload()
  },

  async enhanceApp({ app, router, siteData }) {
    const initialLocale = import.meta.env.SSR ? 'root' : interfaceLocaleForHref(location.href, siteData.value)
    const loadLocale = await installI18n(app, initialLocale)
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
    app.component('Kbd', Kbd)
    app.component('KbdGroup', KbdGroup)
    app.component('KeyboardShortcut', KeyboardShortcut)
    // Comark kebab-cases the MDC tag `::QA` to `<qa>`, and Vue resolves that to
    // the registered name `Qa`; a `QA` registration would never match.
    app.component('Qa', QA)
    app.component('QQGroupList', QQGroupList)
    app.component('Spoiler', Spoiler)
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

    installThemeRouter(router, siteData, initialDocument, loadLocale)
  },
} satisfies Theme
