import type webpack from 'webpack'
import { path } from '@vuepress/utils'

const config: webpack.Configuration = {
  mode: process.env.NODE_ENV,
}

export default config
