import type { Logger, Plugin } from 'vite'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import process from 'node:process'
import { runProcess } from '../../../scripts/font_subset/process.ts'

/** Build fonts before Vite adds the generated CSS to its module graph. */
export function fontSubsetPlugin(): Plugin {
  let logger: Logger | undefined
  let pending: Promise<void> | undefined
  let projectRoot: string

  return {
    name: 'vitepress-font-subset',
    enforce: 'pre',
    configResolved(config) {
      logger = config.logger
      projectRoot = resolve(config.root, '..')
    },
    buildStart() {
      // MPA builds start the SSR bundle first, so whichever build runs first
      // must generate; the shared promise makes the second one a cache hit.
      // VitePress caches a global Markdown renderer. The font scan must not
      // initialize or mutate it while the site's renderer is being prepared.
      pending ??= (async () => {
        const require = createRequire(resolve(projectRoot, 'package.json'))
        const code = await runProcess(process.execPath, [require.resolve('tsx/cli'), resolve(projectRoot, 'scripts/buildFonts.ts')], projectRoot, {
          stdout: output => logger?.info(output.trimEnd()),
          stderr: output => logger?.warn(output.trimEnd()),
        })
        if (code !== 0)
          throw new Error(`Font subset build failed with exit code ${code}`)
      })()
      return pending
    },
  }
}
