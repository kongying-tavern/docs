import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process, { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import cac from 'cac'
import { dump, JSON_SCHEMA, load } from 'js-yaml'
import { writeLocaleImporters } from './locales/importers'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const LOCALE_CODE_RE = /^[a-z]{2}$/
const TEMPLATES = ['zh', 'en'] as const
const ZH_ONLY_PAGES = ['frontmatter.md', 'md-enhance-guide.md', 'announcement.md']

type Template = typeof TEMPLATES[number]

interface Options {
  code: string
  label: string
  lang: string
  template: Template
}

interface LunariaConfig {
  locales: Array<{ label: string, lang: string }>
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

async function collectInput(options: Partial<Options>): Promise<Options> {
  const code = options.code?.trim().toLowerCase() ?? ''
  if (code && options.label) {
    return {
      code,
      label: options.label,
      lang: options.lang ?? code,
      template: options.template ?? 'zh',
    }
  }
  const rl = createInterface({ input: stdin, output: stdout })
  const lines = rl[Symbol.asyncIterator]()
  const ask = async (prompt: string): Promise<string> => {
    if (!prompt)
      return ''
    stdout.write(prompt)
    const { value } = await lines.next()
    return value ?? ''
  }
  const answerCode = code || (await ask('Locale code (ISO 639-1): ')).trim().toLowerCase()
  const label = options.label ?? (await ask('Locale name in its own language: ')).trim()
  const langAnswer = (await ask(
    options.lang
      ? ''
      : `BCP-47 tag (enter to use ${answerCode}): `,
  )).trim()
  const templateAnswer = (await ask(
    options.template
      ? ''
      : 'Template locale to copy from (zh/en, enter for zh): ',
  )).trim().toLowerCase()
  rl.close()
  return {
    code: answerCode,
    label,
    lang: options.lang ?? (langAnswer || answerCode),
    template: assertTemplate(options.template ?? (templateAnswer || 'zh')),
  }
}

function assertTemplate(template: string): Template {
  if (!TEMPLATES.includes(template as Template))
    fail(`invalid template "${template}", expected zh or en`)
  return template as Template
}

function initLocale(options: Options): void {
  const { code } = options
  const label = options.label.trim()
  const lang = options.lang.trim()
  const template = assertTemplate(options.template)
  if (!LOCALE_CODE_RE.test(code))
    fail(`invalid locale code "${code}", expected two lowercase letters (ISO 639-1)`)
  if (existsSync(join(ROOT, `.vitepress/locales/${code}`)))
    fail(`.vitepress/locales/${code} already exists`)
  if (existsSync(join(ROOT, `src/${code}`)))
    fail(`src/${code} already exists`)
  if (!label)
    fail('locale name is required')
  try {
    if (new Intl.Locale(lang).language !== code)
      fail(`language tag "${lang}" must match locale code "${code}"`)
  }
  catch {
    fail(`invalid BCP-47 language tag "${lang}"`)
  }

  // Validate registration and template inputs before creating either target directory.
  const lunariaPath = join(ROOT, 'lunaria.config.json')
  const lunaria = JSON.parse(readFileSync(lunariaPath, 'utf8')) as LunariaConfig
  if (lunaria.locales.some(entry => entry.lang === code))
    fail(`lunaria.config.json already contains ${code}`)
  const templateSite = join(ROOT, `.vitepress/locales/${template}/site.yml`)
  if (!existsSync(join(ROOT, `.vitepress/locales/${template}/config.ts`)))
    fail(`missing config.ts in ${template} template`)
  const site = load(readFileSync(templateSite, 'utf8'), { schema: JSON_SCHEMA }) as Record<string, unknown>
  if (!site || typeof site !== 'object' || !site.title || !site.themeConfig)
    fail(`missing title or themeConfig in ${template} template site.yml`)
  const blogPath = 'blog/[path].paths.ts'
  const blog = readFileSync(join(ROOT, `src/${template}/${blogPath}`), 'utf8')
  const templateBlogLocale = `usePostData('${template.toUpperCase()}')`
  if (!blog.includes(templateBlogLocale))
    fail(`pattern not found in src/${template}/${blogPath}: ${templateBlogLocale}`)

  for (const dir of ['src', '.vitepress/locales']) {
    cpSync(join(ROOT, `${dir}/${template}`), join(ROOT, `${dir}/${code}`), {
      recursive: true,
      filter: src => template !== 'zh' || !ZH_ONLY_PAGES.some(page => src.endsWith(`/${page}`) || src.endsWith(`\\${page}`)),
    })
    console.log(`✓ Copied ${dir}/${template} → ${dir}/${code}`)
  }

  writeFileSync(join(ROOT, `src/${code}/${blogPath}`), blog.replace(templateBlogLocale, `usePostData('${code.toUpperCase()}')`))
  const sitePath = join(ROOT, `.vitepress/locales/${code}/site.yml`)
  site.label = label
  site.lang = lang
  writeFileSync(sitePath, dump(site, { noRefs: true, lineWidth: 110 }))
  console.log('✓ Updated locale identity in site.yml')

  lunaria.locales.push({ label, lang: code })
  writeFileSync(lunariaPath, `${JSON.stringify(lunaria, null, 2)}\n`)
  console.log('✓ Registered in lunaria.config.json')

  writeLocaleImporters(ROOT)
  console.log('✓ Updated locale imports for Vite config bundling')

  console.log(`
Done. Locale "${label}" (${code}) initialized from the ${template} template.
Next steps:
1. Translate src/${code}/**/*.md (priority: translations.md, index.md, download-client.md, community.md, support-us.md)
2. Translate .vitepress/locales/${code}/*.yml (site.yml includes the site title, metadata, menus and language suggestion)
3. Verify: pnpm i18n:check && pnpm typecheck && pnpm dev (preview /docs/${code}/)
4. Follow .github/trans-guide-new-language.md to claim files and submit PRs
localesConfig needs no manual edits: languages are auto-discovered from the locales directory.`)
}

const cli = cac('pnpm init:locale')

cli
  .command('', 'Initialize a new locale from the zh/en template')
  .option('--code <code>', 'ISO 639-1 locale code')
  .option('--label <label>', 'locale name in its own language')
  .option('--lang <lang>', 'BCP-47 language tag')
  .option('--template <zh|en>', 'template locale to copy from (default zh)')
  .action(async (options: Partial<Options>) => {
    initLocale(await collectInput(options))
  })

cli.help()
cli.parse()
