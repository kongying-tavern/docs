import { createApp } from './app.ts'
import 'vitepress/dist/client/theme-default/styles/vars.css'
import 'vitepress/dist/client/theme-default/styles/base.css'
import '@theme/styles/theme.css'
import '@theme/styles/vp-vars.css'
import 'virtual:uno.css'

createApp().mount('#app')
