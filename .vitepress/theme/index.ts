import { h } from 'vue'
import Theme from 'vitepress/theme'
import Coins from './components/Coins.vue'
import VideoIntroduction from './components/VideoIntroduction.vue'
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
    app.component('VideoIntroduction', VideoIntroduction)
    googleAnalytics({
      id: 'G-Q2K9DXZCEY',
      debug: false,
    })
  },
}
