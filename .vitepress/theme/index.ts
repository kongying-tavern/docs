import { h } from 'vue'
import Theme from 'vitepress/theme'
import Coins from './components/Coins.vue'
import googleAnalytics from '../plugins/googleAnalytics'

import 'uno.css'
import './style/vars.css'
import './style/main.css'
export default {
  ...Theme,

  Layout() {
    return h(Theme.Layout, null, {})
  },
  enhanceApp({ app }) {
    app.component('Coins', Coins)
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
  },
}
