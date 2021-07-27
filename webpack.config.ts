import type webpack from 'webpack'

const config: webpack.Configuration = {
  mode: process.env.NODE_ENV == 'production' ? 'production' : 'development',
}

export default config
