import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { resolveConfig } from 'vitepress'
import { expect, test, vi } from 'vitest'
import { getPageExclusions } from '../../.vitepress/config/pageVisibility'

test('only the GitHub Pages target discovers flagged Markdown routes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'docs-visibility-'))
  const pagesDir = join(root, 'pages')
  try {
    for (const dir of ['.vitepress', 'pages/zh', 'pages/public'])
      mkdirSync(join(root, dir), { recursive: true })

    writeFileSync(join(pagesDir, 'zh/index.md'), '# Home\n\ngithubPagesOnly: true\n')
    writeFileSync(join(pagesDir, 'zh/guide.md'), '---\ngithubPagesOnly: false\n---\n# Guide\n')
    writeFileSync(join(pagesDir, 'zh/preview.md'), '\uFEFF---\r\ngithubPagesOnly: true # opt in\r\n---\r\n# Preview\r\n')
    writeFileSync(join(pagesDir, 'zh/yaml-preview.md'), '---yaml\ngithubPagesOnly: True\n---\n# YAML Preview\n')
    writeFileSync(join(pagesDir, 'zh/[slug].md'), '---\ngithubPagesOnly: true\n---\n# {{ $params.slug }}\n')
    writeFileSync(join(pagesDir, 'zh/[slug].paths.js'), 'export default { paths: () => [{ params: { slug: "generated" } }] }')
    writeFileSync(join(pagesDir, 'public/raw.md'), '# Download\n')

    for (const target of [undefined, 'github-pages']) {
      vi.stubEnv('DOCS_DEPLOY_TARGET', target)
      writeFileSync(join(root, '.vitepress/config.mjs'), `export default ${JSON.stringify({
        srcDir: 'pages',
        srcExclude: getPageExclusions(pagesDir),
      })}`)
      const config = await resolveConfig(root, 'build', 'production')
      expect(config.pages).toEqual(target
        ? ['zh/generated.md', 'zh/guide.md', 'zh/index.md', 'zh/preview.md', 'zh/yaml-preview.md']
        : ['zh/guide.md', 'zh/index.md'])
    }
  }
  finally {
    rmSync(root, { recursive: true, force: true })
  }
})
