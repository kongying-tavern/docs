import { h } from 'vue'
import Theme from 'vitepress/theme'
import Footer from './components/Footer.vue'
import googleAnalytics from '../plugins/googleAnalytics'

import 'uno.css'
import './style/vars.css'
import './style/main.css'
export default {
  ...Theme,

  Layout() {
    return h(Theme.Layout, null, {
      'layout-bottom': () => h(Footer),
    })
  },
  enhanceApp({ app }) {
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
  },
}
