import { fileURLToPath } from 'node:url'
import { readRc } from 'zhlint'
import { normalizeConfig } from 'zhlint/lib/options.js'

// rc 文件按脚本所在仓库定位，不在调用方的 cwd 里找：从子目录或仓库根运行
// 都读同一份 `.zhlintrc`。
const ROOT = fileURLToPath(new URL('../..', import.meta.url))

/**
 * 中文排版规则配置。
 *
 * 检查文本由渲染器的 token 流提取，只包含可见正文与组件真实渲染出的属性值，
 * MDC 语法、标题锚点、emoji 短代码等已随渲染被排除，不再需要 opaque 遮罩。
 */
export function createLintZhOptions(root = ROOT) {
  const rc = readRc(root)
  const options = normalizeConfig(rc)
  return options
}
