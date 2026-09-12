import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import process, { stdin, stdout } from 'node:process'
import { createInterface } from 'node:readline'
import { fileURLToPath } from 'node:url'
import cac from 'cac'

const ROOT = resolve(fileURLToPath(import.meta.url), '../..')
const EXISTING_CODES = ['zh', 'en', 'ja']
const LOCALE_CODE_RE = /^[a-z]{2}$/
const TEMPLATES = ['zh', 'en'] as const
const ZH_ONLY_PAGES = ['frontmatter.md', 'md-enhance-guide.md', 'announcement.md']
const LABEL_EXPORT_RE = /export const label = '.*'/
const SUGGEST_TYPE_RE = /\n {2}ja: LanguageSuggestBar\n\}/

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

const TEMPLATE_PLACEHOLDERS: Record<Template, { localCode: string, localBase: string, metaUrl: string }> = {
  zh: {
    localCode: 'zh-CN',
    localBase: '/',
    metaUrl: 'https://yuanshen.site/docs/',
  },
  en: {
    localCode: 'en-US',
    localBase: '/en',
    metaUrl: 'https://yuanshen.site/docs/en/',
  },
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

function replaceIn(file: string, from: string, to: string): void {
  const path = join(ROOT, file)
  const content = readFileSync(path, 'utf8')
  if (!content.includes(from)) {
    const snippet = from.length > 60 ? `${from.slice(0, 60)}...` : from
    fail(`pattern not found in ${file}: ${snippet}`)
  }
  writeFileSync(path, content.replace(from, to))
}

async function collectInput(options: Partial<Options>): Promise<Options> {
  const code = options.code ?? ''
  if (code && options.label) {
    return {
      code,
      label: options.label,
      lang: options.lang ?? `${code}-${code.toUpperCase()}`,
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
  const label = (await ask('Locale name in its own language: ')).trim()
  const langAnswer = (await ask(
    options.lang
      ? ''
      : `BCP-47 tag (enter to use ${answerCode}-${answerCode.toUpperCase()}): `,
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
    lang: options.lang ?? (langAnswer || `${answerCode}-${answerCode.toUpperCase()}`),
    template: assertTemplate(options.template ?? (templateAnswer || 'zh')),
  }
}

function assertTemplate(template: string): Template {
  if (!TEMPLATES.includes(template as Template))
    fail(`invalid template "${template}", expected zh or en`)
  return template as Template
}

function initLocale(options: Options): void {
  const { code, label, lang } = options
  const template = assertTemplate(options.template)
  const placeholders = TEMPLATE_PLACEHOLDERS[template]
  if (!LOCALE_CODE_RE.test(code))
    fail(`invalid locale code "${code}", expected two lowercase letters (ISO 639-1)`)
  if (EXISTING_CODES.includes(code))
    fail(`locale "${code}" already exists`)
  if (existsSync(join(ROOT, `.vitepress/locales/${code}`)))
    fail(`.vitepress/locales/${code} already exists`)
  if (!label)
    fail('locale name is required')

  for (const dir of ['src', '.vitepress/locales']) {
    cpSync(join(ROOT, `${dir}/${template}`), join(ROOT, `${dir}/${code}`), {
      recursive: true,
      filter: src => template !== 'zh' || !ZH_ONLY_PAGES.some(page => src.endsWith(`/${page}`) || src.endsWith(`\\${page}`)),
    })
    console.log(`✓ Copied ${dir}/${template} → ${dir}/${code}`)
  }

  replaceIn(
    `src/${code}/blog/[path].paths.ts`,
    `usePostData('${template.toUpperCase()}')`,
    `usePostData('${code.toUpperCase()}')`,
  )
  replaceIn(`.vitepress/locales/${code}/constants.ts`, `LOCAL_CODE: '${placeholders.localCode}'`, `LOCAL_CODE: '${lang}'`)
  replaceIn(`.vitepress/locales/${code}/constants.ts`, `LOCAL_BASE: '${placeholders.localBase}'`, `LOCAL_BASE: '/${code}'`)
  replaceIn(
    `.vitepress/locales/${code}/constants.ts`,
    `META_URL: '${placeholders.metaUrl}'`,
    `META_URL: 'https://yuanshen.site/docs/${code}/'`,
  )
  replaceIn(
    `.vitepress/locales/${code}/index.ts`,
    `export const ${template}Config`,
    `export const ${code}Config`,
  )
  console.log('✓ Updated placeholder references')

  const indexPath = join(ROOT, `.vitepress/locales/${code}/index.ts`)
  const indexContent = readFileSync(indexPath, 'utf8')
  if (indexContent.includes('export const label')) {
    writeFileSync(indexPath, indexContent.replace(LABEL_EXPORT_RE, `export const label = '${label}'`))
  }
  else {
    writeFileSync(
      indexPath,
      `${indexContent.trimEnd()}\n\nexport const label = '${label}'\nexport const lang = C.LOCAL_CODE\n`,
    )
  }

  const lunariaPath = join(ROOT, 'lunaria.config.json')
  const lunaria = JSON.parse(readFileSync(lunariaPath, 'utf8')) as LunariaConfig
  if (lunaria.locales.some(entry => entry.lang === code))
    fail(`lunaria.config.json already contains ${code}`)
  lunaria.locales.push({ label, lang: code })
  writeFileSync(lunariaPath, `${JSON.stringify(lunaria, null, 2)}\n`)
  console.log('✓ Registered in lunaria.config.json')

  const suggestBarPath = join(ROOT, '.vitepress/locales/common/LanguageSuggestBar.ts')
  let suggestBar = readFileSync(suggestBarPath, 'utf8')
  const zhEntry = [
    '  root: {',
    '    changeLanguage: \'我想更改此页面的语言为：\',',
    '    continue: \'继续\',',
    '  },',
  ].join('\n')
  const enEntry = [
    '  en: {',
    '    changeLanguage: \'I want to change the language of this page to:\',',
    '    continue: \'Continue\',',
    '  },',
  ].join('\n')
  const anchorEntry = template === 'zh' ? zhEntry : enEntry
  const placeholderText = template === 'zh'
    ? {
        changeLanguage: '我想更改此页面的语言为：',
        continue: '继续',
      }
    : {
        changeLanguage: 'I want to change the language of this page to:',
        continue: 'Continue',
      }
  if (!suggestBar.includes(anchorEntry))
    fail(`${template} entry not found in LanguageSuggestBar.ts`)
  const newEntry = [
    `  ${code}: {`,
    `    changeLanguage: '${placeholderText.changeLanguage}',`,
    `    continue: '${placeholderText.continue}',`,
    '  },',
  ].join('\n')
  suggestBar = suggestBar.replace(anchorEntry, `${anchorEntry}\n${newEntry}`)
  suggestBar = suggestBar.replace(
    SUGGEST_TYPE_RE,
    `\n  ja: LanguageSuggestBar\n  ${code}: LanguageSuggestBar\n}`,
  )
  writeFileSync(suggestBarPath, suggestBar)
  console.log('✓ Added LanguageSuggestBar entry (placeholder text, translate it)')

  console.log(`
Done. Locale "${label}" (${code}) initialized from the ${template} template.
Next steps:
1. Translate src/${code}/**/*.md (priority: translations.md, index.md, download-client.md, community.md, support-us.md)
2. Translate .vitepress/locales/${code}/*.ts (title, META_*, nav, sidebar, footer, ui, forum) and the LanguageSuggestBar entry
3. Verify: pnpm typecheck && pnpm dev (preview /docs/${code}/)
4. Claim files in issue #242 and submit PRs
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
