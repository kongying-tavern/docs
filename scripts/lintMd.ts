/**
 * Markdown 结构检查的统一入口（mdclint CLI 包装）。
 *
 * mdclint 不读 `.markdownlintignore`，直接把 `**\/*.md` 交给它会卷进 node_modules、
 * dist 与构建产物。这里以 `.markdownlintignore` 作为唯一忽略源——VSCode 的
 * markdownlint 扩展读同一份文件，编辑器与 CI 因此不会漂移——再按批把文件列表
 * 传给 mdclint，避开命令行长度上限。
 *
 * 由 `node` 直接运行：只用可擦除语法，导入只走相对路径、内置模块与裸包。
 */
import { spawnSync } from 'node:child_process'
import { globSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const bin = fileURLToPath(new URL('../node_modules/mdclint/bin/mdclint.mjs', import.meta.url))
const fix = process.argv.includes('--fix')
// 每次调用 mdclint 都要重新加载配置和内置 markdownlint，分批过细会把启动开销放大几倍；
// 这里按字符预算分批，只在接近 Windows CreateProcess 的 32767 字符上限时才拆。
const MAX_BATCH_CHARS = 16_000

/** 目录型模式（`dist`、`plans/`）要补成 `dist/**` 才会被 glob 当作子树排除。 */
function toExcludePatterns(pattern: string): string[] {
  const trimmed = pattern.replace(/\/+$/, '')
  if (/[*?[\]{}]/.test(trimmed))
    return [trimmed]
  return [trimmed, `${trimmed}/**`]
}

function toBatches(files: string[]): string[][] {
  const batches: string[][] = []
  let batch: string[] = []
  let chars = 0
  for (const file of files) {
    if (batch.length > 0 && chars + file.length > MAX_BATCH_CHARS) {
      batches.push(batch)
      batch = []
      chars = 0
    }
    batch.push(file)
    chars += file.length + 1
  }
  if (batch.length > 0)
    batches.push(batch)
  return batches
}

const ignorePatterns = readFileSync(`${root}/.markdownlintignore`, 'utf8')
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .flatMap(toExcludePatterns)

const files = globSync('**/*.md', { cwd: root, exclude: ignorePatterns })
  .sort()
  .map(file => resolve(root, file))

if (files.length === 0) {
  console.log('[lint:md] no Markdown files to check')
  process.exit(0)
}

let exitCode = 0
for (const batch of toBatches(files)) {
  const args = [bin, ...batch]
  if (fix)
    args.push('--fix')

  const { status } = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' })
  if (status !== 0 && exitCode === 0)
    exitCode = status ?? 1
}

process.exit(exitCode)
