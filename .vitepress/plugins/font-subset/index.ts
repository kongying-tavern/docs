import type { Logger, Plugin } from 'vite'
import { buildFonts } from '../../../scripts/buildFonts'

/** Build fonts before Vite adds the generated CSS to its module graph. */
export function fontSubsetPlugin(): Plugin {
  let isSsrBuild = false
  let logger: Logger | undefined

  return {
    name: 'vitepress-font-subset',
    enforce: 'pre',
    configResolved(config) {
      isSsrBuild = Boolean(config.build.ssr)
      logger = config.logger
    },
    buildStart() {
      if (!isSsrBuild)
        return buildFonts({ logger })
    },
  }
}
