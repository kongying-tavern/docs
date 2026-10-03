import type { TransformContext } from 'vitepress'

import type { ConfigureFuncType } from './types'
import { cfgDynamicHead } from './head'
import { isProd } from './utils'

export const hostname = 'https://yuanshen.site/docs/'

export function createConfigureFunction(): ConfigureFuncType {
  if (isProd) {
    return {
      transformHead: (context: TransformContext) => {
        const { pageData, siteConfig } = context
        return cfgDynamicHead(pageData, siteConfig)
      },
    }
  }
  return {}
}
