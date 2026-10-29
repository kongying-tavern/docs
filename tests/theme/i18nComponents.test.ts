import type { Component } from 'vue'
import { expect, test, vi } from 'vitest'
import { createSSRApp, h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { renderToString } from 'vue/server-renderer'
import { installI18n } from '../../.vitepress/theme/i18n'
import ForumFormActions from '../../src/forum/components/form/ForumFormActions.vue'

const desktop = vi.hoisted(() => ({ value: false }))
vi.mock('@vueuse/core', async original => ({ ...await original<typeof import('@vueuse/core')>(), useMediaQuery: () => ref(desktop.value) }))
function english(component: Component, props = {}) {
  return { setup() {
    useI18n({ useScope: 'global' }).locale.value = 'en'
    return () => h(component, props)
  } }
}

test.each([false, true])('actual form footer selects plural with numeric error count (desktop=%s)', async (isDesktop) => {
  desktop.value = isDesktop
  for (const count of [1, 2]) {
    const app = createSSRApp(english(ForumFormActions, { loading: false, disabled: false, errorCount: count }))
    installI18n(app)
    const html = await renderToString(app)
    expect(html).toContain(count === 1 ? '1 field still needs attention' : '2 fields still need attention')
  }
})
