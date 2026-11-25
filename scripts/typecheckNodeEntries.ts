/**
 * 校验「由 node 直接执行的 TS 入口」。
 *
 * 写进 `package.json` 的 `node xxx.ts` 不经 Vite / tsx 转译：Node 只擦掉类型注解，
 * enum、namespace、构造函数参数属性、`import =` 这类带运行时语义的语法会被直接
 * 拒绝（ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX）。`tsc --noEmit` 默认允许它们，所以这里
 * 用 `erasableSyntaxOnly` 对同一批入口再跑一遍。
 *
 * 装饰器是另一条路：它本身是合法 JS 语法，`erasableSyntaxOnly` 因此放行，但 Node
 * 不生成 `__decorate` 之类的辅助代码，V8 也还没实现装饰器，运行到就会 SyntaxError。
 * 这一条由下面的 AST 检查补。
 *
 * 入口取自 `package.json` 的 scripts，导入链由 tsc 自动跟随，不维护第二份文件清单；
 * 新增一个 `node *.ts` 脚本会自动纳入检查。
 *
 * 同一批入口还有一条模块解析约束：Node 只认相对路径、裸包名和 `package.json` 的
 * `imports`（`#` 前缀）。tsconfig 的 `paths` 只有打包器与 tsc 认识，运行时必抛
 * ERR_MODULE_NOT_FOUND，所以值导入里出现别名也在这里报出来。
 */
import { readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { matchPathAlias } from '../.vitepress/config/aliases.ts'

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

/**
 * 说明符在 Node 下能否解析：`#` 走 `package.json` 的 `imports`，其余别名
 * （`@theme/`、`~/`、`@/`）只存在于 tsconfig 与 Vite。
 */
export function nodeResolves(specifier: string): boolean {
  return specifier.startsWith('#') || !matchPathAlias(specifier)
}

interface AliasImport {
  sourceFile: ts.SourceFile
  node: ts.Node
  specifier: string
}

/**
 * 装饰器不经过 tsc 的 `erasableSyntaxOnly`：它在语法层是合法的，只是运行时缺实现。
 * 这里按 AST 判一次，覆盖类、成员、参数上的全部写法。
 */
export function findDecoratorNodes(sourceFile: ts.SourceFile): ts.Node[] {
  const found: ts.Node[] = []
  const visit = (node: ts.Node): void => {
    if (ts.canHaveDecorators(node)) {
      const decorators = ts.getDecorators(node)
      if (decorators?.length)
        found.push(...decorators)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/** 只跳过声明文件与依赖；文件名由 tsc 规范化成正斜杠，不能再和 fileURLToPath 比前缀。 */
function isProjectFile(fileName: string): boolean {
  return !fileName.replaceAll('\\', '/').includes('/node_modules/')
}

interface DecoratorUsage {
  sourceFile: ts.SourceFile
  node: ts.Node
}

interface RuntimeIssues {
  aliasImports: AliasImport[]
  decorators: DecoratorUsage[]
}

/** 导入链里的值导入（类型导入会被擦除，不算运行时依赖）与 node 跑不起来的装饰器。 */
function collectRuntimeIssues(program: ts.Program): RuntimeIssues {
  const aliasImports: AliasImport[] = []
  const decorators: DecoratorUsage[] = []
  let scanned = 0

  const check = (sourceFile: ts.SourceFile, literal: ts.Node): void => {
    if (ts.isStringLiteralLike(literal) && !nodeResolves(literal.text))
      aliasImports.push({ sourceFile, node: literal, specifier: literal.text })
  }

  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile || !isProjectFile(sourceFile.fileName))
      continue
    scanned++

    for (const decorator of findDecoratorNodes(sourceFile))
      decorators.push({ sourceFile, node: decorator })

    for (const statement of sourceFile.statements) {
      if (ts.isImportDeclaration(statement) && !statement.importClause?.isTypeOnly)
        check(sourceFile, statement.moduleSpecifier)
      if (ts.isExportDeclaration(statement) && !statement.isTypeOnly && statement.moduleSpecifier)
        check(sourceFile, statement.moduleSpecifier)
    }

    const visit = (node: ts.Node): void => {
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const [argument] = node.arguments
        if (argument)
          check(sourceFile, argument)
      }
      ts.forEachChild(node, visit)
    }
    visit(sourceFile)
  }

  // 扫描不到入口说明上面的过滤条件失效了（分隔符、路径前缀），宁可报错也别静默放过。
  if (!scanned)
    throw new Error('scanned no node entry; check the entry paths and file-name separators')

  return { aliasImports, decorators }
}

/** 与 tsc 的 `file:line:col - error` 对齐，几类问题能读成同一份输出。 */
function formatLocation(sourceFile: ts.SourceFile, node: ts.Node): string {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  const file = relative(ROOT, sourceFile.fileName).replaceAll('\\', '/')
  return `${file}:${line + 1}:${character + 1} - error: `
}

function formatAliasImport({ sourceFile, node, specifier }: AliasImport): string {
  return `${formatLocation(sourceFile, node)}node cannot resolve the tsconfig alias `
    + `'${specifier}'; use a relative path, or a '#...' entry in package.json imports`
}

function formatDecorator({ sourceFile, node }: DecoratorUsage): string {
  return `${formatLocation(sourceFile, node)}node cannot run decorators; type stripping `
    + 'leaves them as syntax and V8 does not implement it, so remove the decorator'
}

function main(): void {
  const { scripts } = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as PackageJson
  const entries = collectNodeEntries(scripts ?? {}).map(entry => resolve(ROOT, entry))

  if (!entries.length) {
    console.log('[typecheck:node] no `node *.ts` entry in package.json, nothing to check')
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
  const { aliasImports, decorators } = collectRuntimeIssues(program)

  if (diagnostics.length)
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost))
  for (const aliasImport of aliasImports)
    console.error(formatAliasImport(aliasImport))
  for (const decorator of decorators)
    console.error(formatDecorator(decorator))

  if (diagnostics.length || aliasImports.length || decorators.length) {
    process.exitCode = 1
    return
  }

  console.log(`[typecheck:node] checked ${entries.length} node entry point(s): erasable syntax, no tsconfig aliases, no decorators`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main()
