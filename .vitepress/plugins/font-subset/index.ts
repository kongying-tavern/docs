import type { Plugin } from 'vite'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import process from 'node:process'
import { runProcess } from '../../../scripts/font_subset/process.ts'

/** Build fonts before Vite adds the generated CSS to its module graph. */
export function fontSubsetPlugin(): Plugin {
  let pending: Promise<void> | undefined
  let projectRoot: string

  return {
    name: 'vitepress-font-subset',
    enforce: 'pre',
    configResolved(config) {
      projectRoot = resolve(config.root, '..')
    },
    buildStart() {
      // MPA builds start the SSR bundle first, so whichever build runs first
      // prepares once; VitePress's vite.plugins shares this instance across bundles.
      // VitePress caches a global Markdown renderer. The font scan must not
      // initialize or mutate it while the site's renderer is being prepared.
      pending ??= (async () => {
        const started = performance.now()
        const require = createRequire(resolve(projectRoot, 'package.json'))
        const code = await runProcess(process.execPath, [require.resolve('tsx/cli'), resolve(projectRoot, 'scripts/buildFonts.ts')], projectRoot, {
          // VitePress suppresses logger.info during builds; keep font diagnostics visible.
          stdout: output => process.stdout.write(output),
          stderr: output => process.stderr.write(output),
        })
        if (code !== 0)
          throw new Error(`Font subset build failed with exit code ${code}`)
        process.stdout.write(`[fonts:subset] preparation completed in ${((performance.now() - started) / 1000).toFixed(2)}s\n`)
      })()
      return pending
    },
  }
}
