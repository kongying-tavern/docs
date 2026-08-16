import type { Logger, Plugin } from 'vite'
import { buildFonts } from '../../../scripts/buildFonts'

/** Build fonts before Vite adds the generated CSS to its module graph. */
export function fontSubsetPlugin(): Plugin {
  let logger: Logger | undefined
  let pending: Promise<void> | undefined

  return {
    name: 'vitepress-font-subset',
    enforce: 'pre',
    configResolved(config) {
      logger = config.logger
    },
    buildStart() {
      // MPA builds start the SSR bundle first, so whichever build runs first
      // must generate; the shared promise makes the second one a cache hit.
      pending ??= buildFonts({ logger })
      return pending
    },
  }
}
