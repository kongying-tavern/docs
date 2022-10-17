import { h } from 'vue'
import Theme from 'vitepress/theme'
import { CodeGroup, CodeGroupItem, Link, Footer } from '../components'

import 'uno.css'
import '../components/styles/index.css'
export default {
  ...Theme,
  Layout() {
    return h(Theme.Layout, null, {
      'layout-bottom': () => h(Footer),
    })
  },
  enhanceApp({ app }) {
    app.component('CodeGroup', CodeGroup)
    app.component('CodeGroupItem', CodeGroupItem)
    app.component('Link', Link)
  },
}
