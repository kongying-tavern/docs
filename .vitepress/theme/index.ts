import { h } from 'vue'
import Theme from 'vitepress/theme-without-fonts'
import Coins from './components/Coins.vue'
import MediaIntroduction from './components/MediaIntroduction.vue'
import googleAnalytics from '../plugins/googleAnalytics'

import 'uno.css'
import './styles/vars.css'
import './styles/main.css'

export default {
  ...Theme,

  Layout() {
    return h(Theme.Layout, null, {})
  },
  enhanceApp({ app }) {
    app.component('Coins', Coins)
    app.component('MediaIntroduction', MediaIntroduction)
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
  },
}
