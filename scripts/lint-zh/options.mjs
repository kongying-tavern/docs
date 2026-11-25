import { readRc } from 'zhlint'
import { normalizeConfig } from 'zhlint/lib/options.js'

/**
 * 中文排版规则配置。
 *
 * 检查文本由渲染器的 token 流提取，只包含可见正文与组件真实渲染出的属性值，
 * MDC 语法、标题锚点、emoji 短代码等已随渲染被排除，不再需要 opaque 遮罩。
 */
export function createLintZhOptions(root = './') {
  const rc = readRc(root)
  const options = normalizeConfig(rc)
  return options
}
