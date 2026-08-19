import type { Logger, Plugin } from 'vite'
import { resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  generateFontFace,
  getMetricsForFamily,
  readMetrics,
} from 'fontaine'
import { normalizePath } from 'vite'
import {
  loadFontSubsetConfig,
  resolveFontSubsetPaths,
} from './config'

const defaultProjectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))

function fallbackFamilyName(fontFamily: string, suffix: string): string {
  return `${fontFamily} ${suffix}`
}

export async function generateFontaineFallbackCss(
  projectRoot: string,
): Promise<string> {
  const config = loadFontSubsetConfig()
  const paths = resolveFontSubsetPaths(projectRoot, config)
  const fallbackMetrics = new Map(
    await Promise.all(config.fontaine.fallbacks.map(async (family) => {
      const metrics = await getMetricsForFamily(family)
      if (!metrics)
        throw new Error(`No Fontaine metrics are available for fallback family: ${family}`)
      return [family, metrics] as const
    })),
  )

  const rules: string[] = []
  for (const font of config.fonts) {
    const sourceUrl = pathToFileURL(resolve(paths.sourceDir, font.sourceFile))
    const metrics = await readMetrics(sourceUrl)
    if (!metrics)
      throw new Error(`Fontaine could not read source font metrics: ${font.sourceFile}`)

    // Emit the preferred fallback last so it wins the CSS cascade.
    for (const fallback of config.fontaine.fallbacks.toReversed()) {
      rules.push(generateFontFace(metrics, {
        'name': fallbackFamilyName(
          font.cssFamily,
          config.fontaine.fallbackNameSuffix,
        ),
        'font': fallback,
        'metrics': fallbackMetrics.get(fallback),
        'font-style': config.css.fontStyle,
        'font-weight': String(config.css.fontWeight),
      }))
    }
  }

  return [
    '/* Generated at compile time from source-font metrics by Fontaine. */',
    ...rules,
  ].join('\n')
}

/** Use source-font metrics because per-subset metrics produce inconsistent widths. */
export function fontaineFallbackPlugin(): Plugin {
  const config = loadFontSubsetConfig()
  const cssEntrySuffix = normalizePath(config.fontaine.cssEntry)
  let fallbackCss: Promise<string> | undefined
  let isBuild = false
  let isSsrBuild = false
  let logger: Logger | undefined
  let transformed = false

  return {
    name: 'vitepress-fontaine-fallback',
    enforce: 'pre',
    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === 'build'
      isSsrBuild = Boolean(resolvedConfig.build.ssr)
      logger = resolvedConfig.logger
    },
    buildStart() {
      transformed = false
    },
    async transform(code, id) {
      const file = normalizePath(id.split('?', 1)[0])
      if (!file.endsWith(cssEntrySuffix))
        return

      transformed = true
      fallbackCss ??= generateFontaineFallbackCss(defaultProjectRoot)
      const generatedCss = await fallbackCss
      // Keep metric parity in dev, but log only the production client build.
      if (isBuild && !isSsrBuild) {
        const count = config.fonts.length * config.fontaine.fallbacks.length
        logger?.info(`[fonts:fontaine] injected ${count} fallback metric rules`)
      }
      return `${code}\n\n${generatedCss}`
    },
    buildEnd(error) {
      if (!error && !isSsrBuild && !transformed)
        this.error(`Fontaine CSS entry was not transformed: ${config.fontaine.cssEntry}`)
    },
  }
}
