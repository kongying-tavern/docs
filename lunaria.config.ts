import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { defineConfig } from '@lunariajs/core/config'
import { getLocaleDirs, LOCALES_DIR } from './.vitepress/config/localeDirs.ts'
import { loadSiteLocale } from './.vitepress/config/siteLocale.ts'
import { DEFAULT_LOCALE } from './.vitepress/locales/common.ts'

const loadLocale = (lang: string) => loadSiteLocale(pathToFileURL(join(LOCALES_DIR, lang, 'site.yml')))
const sourceLocale = loadLocale(DEFAULT_LOCALE)
const localizedLocales = getLocaleDirs()
  .filter(lang => lang !== DEFAULT_LOCALE)
  .map(lang => ({ label: loadLocale(lang).label, lang }))
if (localizedLocales.length === 0)
  throw new Error(`No translated locales found in ${LOCALES_DIR}`)

export default defineConfig({
  outDir: './dist/_translations',
  repository: {
    name: 'kongying-tavern/docs',
  },
  sourceLocale: {
    label: sourceLocale.label,
    lang: DEFAULT_LOCALE,
  },
  locales: localizedLocales as [typeof localizedLocales[number], ...typeof localizedLocales],
  tracking: {
    ignoredKeywords: ['@ignore', '\\[ci\\]', '\\[format\\]'],
  },
  files: [
    {
      include: [`pages/${DEFAULT_LOCALE}/**/*.md`],
      pattern: 'pages/@lang/@path',
      exclude: [
        'pages/public/**',
        `pages/${DEFAULT_LOCALE}/frontmatter.md`,
        `pages/${DEFAULT_LOCALE}/staff.md`,
        `pages/${DEFAULT_LOCALE}/md-enhance-guide.md`,
        `pages/${DEFAULT_LOCALE}/team.md`,
        `pages/${DEFAULT_LOCALE}/announcement.md`,
        `pages/${DEFAULT_LOCALE}/blog/[path].md`,
      ],
      type: 'universal',
    },
  ],
})
