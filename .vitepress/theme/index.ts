import type { Theme } from 'vitepress'
import { PiniaColada } from '@pinia/colada'
import { createPinia } from 'pinia'
import DefaultTheme from 'vitepress/theme-without-fonts'
import { ref } from 'vue'
import { useForumTranslationPreferences } from '@/src/forum/composables/data/useForumTranslationPreferences.ts'
import { useForumViewMode } from '@/src/forum/composables/state/useForumViewMode.ts'
import { installTelemetry } from '@/src/services/telemetry/index.ts'
import googleAnalytics from '../plugins/google-analytics/index.ts'
import { forumStartupKey } from './components/forum/index.ts'
import { installI18n, interfaceLocaleForHref, setupI18n } from './i18n/index.ts'
import Layout from './layouts/Layout.vue'
import { loadFontStylesheets } from './lib/fontStylesheets.ts'
import { installLayoutComponents } from './lib/layoutComponents.ts'
import { installMarkdownComponents } from './lib/markdownComponents.ts'
import { useForumLinkPreload } from './router/forumPreload.ts'
import { installThemeRouter } from './router/installThemeRouter.ts'

import 'uno.css'

const pinia = createPinia()

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

    installMarkdownComponents(app)
    installLayoutComponents(app)

    if (!import.meta.env.SSR) {
      loadFontStylesheets()
    }

    installThemeRouter(router, siteData, initialDocument, loadLocale)
  },
} satisfies Theme
