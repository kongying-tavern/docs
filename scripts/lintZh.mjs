/**
 * zh 文档的中文排版检查。
 *
 * 直接用 zhlint 的 Node API 替代 CLI，因为：
 * - 站点 MDC 短代码（{color:...}、{%= ... %}）与 spaceOutsideHalfwidthBracket
 *   规则天然冲突——zhlint 配置合并机制无法在 JSON 里“取消”默认开启的规则键，
 *   只能在归一化后的 options 上删除该键，让括号间距分支整体跳过
 *   （全角括号的 noSpaceOutsideFullwidthBracket 检查保留）。
 * - CLI 的 hexo hyper parser 只匹配 `{% tag %}`，匹配不了站点的 `{%= ... %}` 模板，
 *   由 .zhlintcaseignore 的 {%,%} 用例覆盖。
 */
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { readRc, report, run } from 'zhlint'
import { normalizeConfig } from 'zhlint/lib/options.js'

const fix = process.argv.includes('--fix')
const rc = readRc('./')
const options = normalizeConfig(rc)
delete options.rules.spaceOutsideHalfwidthBracket

// VitePress 标题锚点 `{#id}` 与 zhlint 的括号配对规则冲突，作为 opaque 区域跳过。
// “括号未匹配”是解析器错误，case-ignore 无法覆盖，必须用 hyper parser 占位。
const HEADING_ANCHOR_REGEX = /\{#[\w-]*\}/g
options.hyperParse.push((data) => {
  data.modifiedValue = data.modifiedValue.replace(HEADING_ANCHOR_REGEX, (originValue, index) => {
    data.ignoredByParsers.push({
      name: 'mdc-anchor',
      meta: 'mdc-anchor',
      index,
      length: originValue.length,
      originValue,
    })
    return '@'.repeat(originValue.length)
  })
  return data
})

// MDC 组件的 `---` 属性块是 YAML；半角冒号是语法，不能按中文标点改写。
const MDC_YAML_PROPS_REGEX = /(^|\n)(::[^\r\n]*\r?\n)(---\r?\n[\s\S]*?\r?\n---)(?=\r?\n)/g
options.hyperParse.unshift((data) => {
  data.modifiedValue = data.modifiedValue.replace(
    MDC_YAML_PROPS_REGEX,
    (_originValue, leading, component, yaml, index) => {
      const yamlIndex = index + leading.length + component.length
      data.ignoredByParsers.push({
        name: 'mdc-yaml-props',
        meta: 'mdc-yaml-props',
        index: yamlIndex,
        length: yaml.length,
        originValue: yaml,
      })
      return `${leading}${component}${'@'.repeat(yaml.length)}`
    },
  )
  return data
})

const resultList = globSync('src/zh/**/*.md').map((file) => {
  console.log(`[start] ${file}`)
  const origin = readFileSync(file, { encoding: 'utf8' })
  const { result, validations } = run(origin, options)
  return { file, origin, result, validations }
})

const exitCode = report(resultList)

// zhlint 只覆盖 markdown；locale 词条（TS 字面量）同样面向中日文读者，
// 这里补一层目标语言标点检查，避免 ASCII 波浪线与半角标点漏进 UI。
const LOCALE_TS_GLOBS = [
  '.vitepress/locales/zh/*.ts',
  '.vitepress/locales/ja/*.ts',
  '.vitepress/locales/common/*.ts',
]
const STRING_LITERAL_REGEX = /'((?:[^'\\]|\\.)*)'/g
const PUNCT_RULES = [
  { message: 'ASCII 波浪线应写作全角', test: t => t.includes('~') && !t.includes('://') },
  { message: '半角冒号紧贴中日文', test: t => /[\u3040-\u30FF\u4E00-\u9FFF]:/.test(t) },
  { message: '半角括号紧贴汉字', test: t => /\([\u4E00-\u9FFF]/.test(t) },
]
const localeIssues = globSync(LOCALE_TS_GLOBS).flatMap((file) => {
  const lines = readFileSync(file, { encoding: 'utf8' }).split(/\r?\n/)
  return lines.flatMap((line, index) => {
    if (line.trimStart().startsWith('import ') || line.trimStart().startsWith('//'))
      return []
    return [...line.matchAll(STRING_LITERAL_REGEX)]
      .filter(([, text]) => PUNCT_RULES.some(rule => rule.test(text)))
      .map(([, text]) => ({
        file,
        line: index + 1,
        message: PUNCT_RULES.find(rule => rule.test(text)).message,
        text,
      }))
  })
})
if (localeIssues.length) {
  console.log('\n[locale 标点] locale 词条中的中日文标点：')
  localeIssues.forEach(({ file, line, message, text }) =>
    console.log(`  ${file}:${line}  ${message}  →  ${text}`))
}

if (fix) {
  resultList.forEach(({ file, origin, result }) => {
    if (origin !== result)
      writeFileSync(file, result)
  })
}
else if (exitCode || localeIssues.length) {
  process.exit(exitCode || 1)
}
