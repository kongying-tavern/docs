import { createSSRApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

export function createApp() {
  return createSSRApp(App).use(createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: { ui: { shortcut: { plus: ' plus ', then: ', then ' } } } },
  }))
}
