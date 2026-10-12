import type { ResolvedConfig } from 'vite'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { beforeEach, test, vi } from 'vitest'
import { fontSubsetPlugin } from '../../.vitepress/plugins/font-subset/index'
import { mdcMetadataPlugin } from '../../.vitepress/plugins/mdc-metadata'

const mocks = vi.hoisted(() => ({
  runProcess: vi.fn<(command: string, args: string[], cwd: string, handlers: unknown) => Promise<number>>(async () => 0),
  writeFile: vi.fn(),
  checker: vi.fn(() => ({ getComponentMeta: () => ({ props: [] }) })),
}))
vi.mock('../../scripts/font_subset/process', () => ({ runProcess: mocks.runProcess }))
vi.mock('vue-component-meta', () => ({ createCheckerByJson: mocks.checker }))
vi.mock('node:fs', async original => ({
  ...await original<typeof import('node:fs')>(),
  writeFileSync: mocks.writeFile,
}))

const projectRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)))
beforeEach(() => {
  vi.clearAllMocks()
  mocks.runProcess.mockResolvedValue(0)
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
})

function fontBuild(plugin = fontSubsetPlugin()) {
  const configure = plugin.configResolved as (config: ResolvedConfig) => void
  configure({ root: resolve(projectRoot, 'src') } as ResolvedConfig)
  return plugin.buildStart as () => Promise<void>
}

test('shared SPA and SSR-first font preparation runs once, while a new build gets fresh state', async () => {
  const plugin = fontSubsetPlugin()
  const first = fontBuild(plugin)
  await Promise.all([first(), first()])
  await fontBuild(plugin)()
  assert.equal(mocks.runProcess.mock.calls.length, 1)
  await fontBuild()()
  assert.equal(mocks.runProcess.mock.calls.length, 2)
  assert.equal(mocks.runProcess.mock.calls[0]![2], projectRoot)
})

test('font preparation failures propagate and a separate build can retry', async () => {
  mocks.runProcess.mockResolvedValueOnce(1)
  const build = fontBuild()
  await assert.rejects(build(), /Font subset build failed with exit code 1/)
  await assert.rejects(build(), /Font subset build failed with exit code 1/)
  assert.equal(mocks.runProcess.mock.calls.length, 1)
  await fontBuild()()
  assert.equal(mocks.runProcess.mock.calls.length, 2)
})

test('editor metadata stays serve-only and regenerates for a loaded client component update', async () => {
  const plugin = mdcMetadataPlugin()
  assert.equal(plugin.apply, 'serve')
  const start = plugin.buildStart as () => Promise<void>
  await start()
  await start()
  assert.equal(mocks.writeFile.mock.calls.length, 1)
  const update = plugin.hotUpdate as (this: { environment: { name: string } }, context: { file: string }) => Promise<void>
  const file = resolve(projectRoot, '.vitepress/theme/components/ui/button/Button.vue').replaceAll('\\', '/')
  await update.call({ environment: { name: 'ssr' } }, { file })
  assert.equal(mocks.writeFile.mock.calls.length, 1)
  await update.call({ environment: { name: 'client' } }, { file })
  assert.equal(mocks.writeFile.mock.calls.length, 2)
})
