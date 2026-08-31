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

const resultList = globSync('src/zh/**/*.md').map((file) => {
  console.log(`[start] ${file}`)
  const origin = readFileSync(file, { encoding: 'utf8' })
  const { result, validations } = run(origin, options)
  return { file, origin, result, validations }
})

const exitCode = report(resultList)
if (fix) {
  resultList.forEach(({ file, origin, result }) => {
    if (origin !== result)
      writeFileSync(file, result)
  })
}
else if (exitCode) {
  process.exit(exitCode)
}
