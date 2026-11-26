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
 *
 * 另有两条「tsc 放行、node 必崩」的写法，靠同一个 program 的 checker 补：
 * - `.json` 导入缺 `with { type: 'json' }` → ERR_IMPORT_ATTRIBUTE_MISSING；
 * - ESM 里的 CJS 全局量（`require`/`module`/`exports`/`__dirname`/`__filename`）
 *   → ReferenceError，而 tsc 从 `@types/node` 拿到声明，不会报错。
 */
import { existsSync, readFileSync } from 'node:fs'
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

/** Node 的 ESM 加载器在运行时才检查这些；tsc 从 `@types/node` 拿到声明后一律放行。 */
const CJS_GLOBALS = new Set(['require', 'module', 'exports', '__dirname', '__filename'])

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

interface JsonImport {
  sourceFile: ts.SourceFile
  node: ts.Node
  specifier: string
}

interface CjsGlobalUsage {
  sourceFile: ts.SourceFile
  node: ts.Node
  name: string
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

/** `with { type: 'json' }`：缺了它 Node 的 ESM 加载器直接抛 ERR_IMPORT_ATTRIBUTE_MISSING。 */
function hasJsonTypeAttribute(attributes: ts.ImportAttributes | undefined): boolean {
  return !!attributes?.elements.some(element => element.name.text === 'type'
    && ts.isStringLiteralLike(element.value)
    && element.value.text === 'json')
}

/**
 * `.json` 导入：静态导入看 import 子句的 attributes；动态导入只有带第二个参数
 * 才可能声明 attributes，没写就是运行时才报错的那种。
 */
export function findJsonImports(sourceFile: ts.SourceFile): ts.StringLiteralLike[] {
  const found: ts.StringLiteralLike[] = []
  const isJsonSpecifier = (specifier: ts.Expression): specifier is ts.StringLiteralLike =>
    ts.isStringLiteralLike(specifier) && specifier.text.endsWith('.json')

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)
      && !node.importClause?.isTypeOnly
      && isJsonSpecifier(node.moduleSpecifier)
      && !hasJsonTypeAttribute(node.attributes)) {
      found.push(node.moduleSpecifier)
    }
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const [specifier, options] = node.arguments
      if (specifier && isJsonSpecifier(specifier) && !options)
        found.push(specifier)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return found
}

/**
 * 名字出现在不能算「引用」的位置：属性名、导入导出名、声明名。
 * 剩下的交给 checker，本地声明因此不会被误判成全局。
 */
function isNamePosition(node: ts.Identifier): boolean {
  const { parent } = node
  if (ts.isPropertyAccessExpression(parent) && parent.name === node)
    return true
  if (ts.isQualifiedName(parent) && parent.right === node)
    return true
  if (ts.isPropertyAssignment(parent) || ts.isMethodDeclaration(parent) || ts.isPropertyDeclaration(parent))
    return parent.name === node
  if (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isFunctionDeclaration(parent))
    return parent.name === node
  if (ts.isImportSpecifier(parent) || ts.isExportSpecifier(parent) || ts.isNamespaceImport(parent))
    return true
  if (ts.isImportClause(parent))
    return parent.name === node
  return ts.isEnumMember(parent) && parent.name === node
}

/** 引用了由声明文件（`@types/node`）提供的全局量，也就是 ESM 里跑不起来的 CJS 名字。 */
export function findCjsGlobals(program: ts.Program, sourceFile: ts.SourceFile): ts.Identifier[] {
  const checker = program.getTypeChecker()
  const found: ts.Identifier[] = []

  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node) && CJS_GLOBALS.has(node.text) && !isNamePosition(node)) {
      const symbol = checker.getSymbolAtLocation(node)
      if (symbol?.declarations?.some(declaration => declaration.getSourceFile().isDeclarationFile))
        found.push(node)
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
  jsonImports: JsonImport[]
  cjsGlobals: CjsGlobalUsage[]
}

/** 导入链里的值导入（类型导入会被擦除，不算运行时依赖），以及 node 跑不起来的写法。 */
function collectRuntimeIssues(program: ts.Program): RuntimeIssues {
  const aliasImports: AliasImport[] = []
  const decorators: DecoratorUsage[] = []
  const jsonImports: JsonImport[] = []
  const cjsGlobals: CjsGlobalUsage[] = []
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

    for (const node of findJsonImports(sourceFile))
      jsonImports.push({ sourceFile, node, specifier: node.text })

    for (const node of findCjsGlobals(program, sourceFile))
      cjsGlobals.push({ sourceFile, node, name: node.text })

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

  return { aliasImports, decorators, jsonImports, cjsGlobals }
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

function formatJsonImport({ sourceFile, node, specifier }: JsonImport): string {
  return `${formatLocation(sourceFile, node)}node needs \`with { type: 'json' }\` for `
    + `'${specifier}'; without it the ESM loader throws ERR_IMPORT_ATTRIBUTE_MISSING`
}

function formatCjsGlobal({ sourceFile, node, name }: CjsGlobalUsage): string {
  return `${formatLocation(sourceFile, node)}'${name}' is a CommonJS global and undefined in ESM; `
    + 'tsc finds it in @types/node, node throws a ReferenceError — use import.meta.url or import()'
}

function main(): void {
  const { scripts } = JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as PackageJson
  const entries = collectNodeEntries(scripts ?? {}).map(entry => resolve(ROOT, entry))

  if (!entries.length) {
    console.log('[typecheck:node] no `node *.ts` entry in package.json, nothing to check')
    return
  }

  // tsc 把「找不到 root 文件」报成 6053，会被 erasableSyntaxOnly 的过滤丢掉；
  // 入口路径写错时必须在这里失败，否则检查会对着不存在的文件报“通过”。
  const missing = entries.filter(entry => !existsSync(entry))
  if (missing.length) {
    for (const entry of missing)
      console.error(`${relative(ROOT, entry).replaceAll('\\', '/')} - error: node entry not found; check the script path in package.json`)
    process.exitCode = 1
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
  const { aliasImports, decorators, jsonImports, cjsGlobals } = collectRuntimeIssues(program)

  if (diagnostics.length)
    console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost))
  for (const aliasImport of aliasImports)
    console.error(formatAliasImport(aliasImport))
  for (const decorator of decorators)
    console.error(formatDecorator(decorator))
  for (const jsonImport of jsonImports)
    console.error(formatJsonImport(jsonImport))
  for (const cjsGlobal of cjsGlobals)
    console.error(formatCjsGlobal(cjsGlobal))

  const issues = diagnostics.length + aliasImports.length + decorators.length
    + jsonImports.length + cjsGlobals.length
  if (issues) {
    process.exitCode = 1
    return
  }

  console.log(`[typecheck:node] checked ${entries.length} node entry point(s): erasable syntax, `
    + 'no tsconfig aliases, no decorators, no ESM/CJS mismatches')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  main()
