import type {
  PageData,
  TransformContext,
  TransformPageContext,
} from 'vitepress'

import type { ConfigureFuncType } from './types'
import { cfgDynamicHead } from './head'
import { cfgDynamicTitleTemplate } from './title'
import { isProd } from './utils'

export const hostname = 'https://yuanshen.site/docs/'

export function createConfigureFunction(): ConfigureFuncType {
  if (isProd) {
    return {
      transformHead: (context: TransformContext) => {
        const { pageData, siteConfig } = context
        cfgDynamicHead(pageData, siteConfig)
      },
      transformPageData: (
        pageData: PageData,
        context: TransformPageContext,
      ) => {
        const { siteConfig } = context
        cfgDynamicTitleTemplate(pageData, siteConfig)
      },
    }
  }
  return {
    transformPageData: (pageData: PageData, context: TransformPageContext) => {
      const { siteConfig } = context
      cfgDynamicHead(pageData, siteConfig)
      cfgDynamicTitleTemplate(pageData, siteConfig)
    },
  } as ConfigureFuncType
}
