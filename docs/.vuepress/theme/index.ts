import { path } from '@vuepress/utils'

import type { Plugin } from '@vuepress/core'

const localTheme: Plugin = (options, app) => {
  return {
    name: 'vuepress-theme-local',
    extends: '@vuepress/theme-default',
    layouts: {
      Layout: path.resolve(__dirname, '../layout/layout.vue'),
      // 404: path.resolve(__dirname, 'layouts/404.vue'),
    },
  }
}

export default localTheme
