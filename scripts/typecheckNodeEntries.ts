/**
 * 校验「由 node 直接执行的 TS 入口」。
 *
 * 写进 `package.json` 的 `node xxx.ts` 不经 Vite / tsx 转译：Node 只擦掉类型注解，
 * enum、namespace、构造函数参数属性、`import =` 这类带运行时语义的语法会被直接
 * 拒绝（ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX）。`tsc --noEmit` 默认允许它们，所以这里
 * 用 `erasableSyntaxOnly` 对同一批入口再跑一遍。
 *
 * 入口取自 `package.json` 的 scripts，导入链由 tsc 自动跟随，不维护第二份文件清单；
 * 新增一个 `node *.ts` 脚本会自动纳入检查。
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TSCONFIG = resolve(ROOT, 'tsconfig.json')
const PACKAGE_JSON = resolve(ROOT, 'package.json')

/**
 * `node` 后面那个 `.ts` 文件，允许中间夹 `--flag` / `--flag=value`。
 * 排除引号与 shell 连接符，`node -e "..."` 这类内联脚本因此不会被误判。
 */
const NODE_TS_ENTRY = /(?:^|[\s&|;(])node\s+(?:-\S+\s+)*([^\s"'&|;]+\.ts)(?=\s|$)/gu

interface PackageJson {
  scripts?: Record<string, string>
}

/** scripts 里所有 `node *.ts` 入口，按出现顺序去重。 */
export function collectNodeEntries(scripts: Record<string, string>): string[] {
  const entries = new Set<string>()
  for (const command of Object.values(scripts)) {
    for (const match of command.matchAll(NODE_TS_ENTRY))
      entries.add(match[1])
  }
  return [...entries]
}

/**
 * TS 对「语法无法剥离」的报错码是 1294；同时按文案兜底，避免版本升级后码值变化
 * 让这项检查静默通过。其余类型错误交给 `typecheck:ts`，这里不重复报。
 */
function isErasableSyntaxDiagnostic(diagnostic: ts.Diagnostic): boolean {
  return diagnostic.code === 1294
    || ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ').includes('erasableSyntaxOnly')
}

const formatHost: ts.FormatDiagnosticsHost = {
  getCanonicalFileName: fileName => fileName,
  getCurrentDirectory: () => ROOT,
  getNewLine: () => ts.sys.newLine,
}

function main(): void {
  const { scripts } = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as PackageJson
  const entries = collectNodeEntries(scripts ?? {}).map(entry => resolve(ROOT, entry))

  if (!entries.length) {
    console.log('[typecheck:node] package.json 里没有 `node *.ts` 入口，跳过。')
    return
  }

  const config = ts.getParsedCommandLineOfConfigFile(TSCONFIG, { erasableSyntaxOnly: true, noEmit: true }, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    },
  })
  if (!config)
    throw new Error(`Cannot read ${TSCONFIG}`)

  const program = ts.createProgram({ rootNames: entries, options: config.options })
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(isErasableSyntaxDiagnostic)

  if (diagnostics.length) {
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost))
    process.exitCode = 1
    return
  }

  console.log(`[typecheck:node] ${entries.length} 个 Node 入口及其导入链可被类型剥离。`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main()
