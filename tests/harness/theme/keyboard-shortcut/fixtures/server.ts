import { renderToString } from 'vue/server-renderer'
import { createApp } from './app.ts'

export const render = () => renderToString(createApp())
