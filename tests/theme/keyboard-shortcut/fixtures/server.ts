import { renderToString } from 'vue/server-renderer'
import { createApp } from './app'

export const render = () => renderToString(createApp())
