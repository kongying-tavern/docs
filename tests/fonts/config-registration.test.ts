import type { Plugin, PluginOption } from 'vite'
import assert from 'node:assert/strict'
import { test, vi } from 'vitest'
import createSiteConfig from '../../.vitepress/config'
import createViteConfig from '../../vite.config'

async function plugins(options: PluginOption[] = []): Promise<Plugin[]> {
  const result: Plugin[] = []
  for (const option of options) {
    const plugin = await option
    if (Array.isArray(plugin))
      result.push(...await plugins(plugin))
    else if (plugin)
      result.push(plugin)
  }
  return result
}

test('real configs own one build-scoped font instance and keep editor metadata serve-only', async () => {
  vi.stubEnv('VITE_DEVTOOLS', 'false')
  const first = await createSiteConfig()
  const second = await createSiteConfig()
  const firstFonts = (await plugins(first.vite?.plugins)).filter(plugin => plugin.name === 'vitepress-font-subset')
  const secondFonts = (await plugins(second.vite?.plugins)).filter(plugin => plugin.name === 'vitepress-font-subset')
  assert.equal(firstFonts.length, 1)
  assert.equal(secondFonts.length, 1)
  assert.notEqual(firstFonts[0], secondFonts[0])
  assert.equal(typeof createViteConfig, 'function')
  const external = await (createViteConfig as (env: { command: 'build', mode: string }) => import('vite').UserConfig)({ command: 'build', mode: 'production' })
  const externalPlugins = await plugins(external.plugins)
  assert.equal(externalPlugins.some(plugin => plugin.name === 'vitepress-font-subset'), false)
  const metadata = externalPlugins.filter(plugin => plugin.name === 'vite-plugin-mdc-metadata')
  assert.equal(metadata.length, 1)
  assert.equal(metadata[0]!.apply, 'serve')
}, 15000)
