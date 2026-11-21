import type { Rule } from 'eslint'
import { existsSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { matchPathAlias } from '../../.vitepress/config/aliases.ts'

/**
 * Local import rules. Both work on the resolved file rather than on the string:
 *
 * - `native-import-path` spells the specifier the way plain Node needs it
 *   (`x.ts`, `x/index.ts`), because the site config is loaded by native ESM.
 * - `prefer-barrel-import` routes cross-directory imports through the target
 *   directory's `index.ts` so each feature directory stays a boundary.
 *
 * Resolution lives here on purpose: ESLint is the enforcement point, so there is
 * no second copy to keep in sync.
 */

interface LiteralNode {
  type: string
  value: unknown
}

interface ImportingNode {
  source?: LiteralNode
  callee?: { type: string, object?: { name?: string } }
  arguments?: LiteralNode[]
}

/** `import('x')` in type position: typescript-eslint wraps the specifier in a TSLiteralType. */
interface ImportTypeNode {
  argument?: {
    type: string
    literal?: LiteralNode
    value?: unknown
  }
}

interface ImportSpecifierNode {
  type: string
  imported?: { type: string, name?: string, value?: unknown }
}

interface ImportDeclarationNode extends ImportingNode {
  specifiers?: ImportSpecifierNode[]
}

const TS_SUFFIXES = ['.ts', '.d.ts', '.mts', '.cts', '.tsx'] as const
const JS_SUFFIXES = ['.js', '.mjs', '.cjs', '.jsx'] as const
const SFC_SUFFIXES = ['.vue'] as const
const INDEX_SUFFIXES = ['.ts', '.mts', '.js', '.mjs', '.cjs', '.vue'] as const

const EXPLICIT_EXTENSION = /\.(?:[cm]?[jt]sx?|vue|css|json|ya?ml|svg|png|jpe?g|webp|avif|gif|woff2?|txt)$/i
const NON_PROJECT_SPECIFIER = /^(?:[a-z][\w+.-]*:|#|\/)/i

const roots = new Map<string, string | null>()

function projectRootOf(fromFile: string): string | null {
  const start = path.dirname(fromFile)
  const cached = roots.get(start)
  if (cached !== undefined)
    return cached
  let dir = start
  let found: string | null = null
  while (true) {
    if (existsSync(path.join(dir, 'package.json'))) {
      found = dir
      break
    }
    const parent = path.dirname(dir)
    if (parent === dir)
      break
    dir = parent
  }
  roots.set(start, found)
  return found
}

function isFile(target: string): boolean {
  try {
    return statSync(target).isFile()
  }
  catch {
    return false
  }
}

function projectTarget(root: string, fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('.'))
    return path.resolve(path.dirname(fromFile), specifier)
  const match = matchPathAlias(specifier)
  return match ? path.resolve(root, match.alias.root, match.rest) : null
}

/** Prefer the importer's own family so a `.mjs` file keeps resolving `.mjs`. */
function suffixCandidates(fromFile: string): readonly string[] {
  const extension = path.extname(fromFile).toLowerCase()
  const isJs = extension === '.js' || extension === '.mjs' || extension === '.cjs' || extension === '.jsx'
  return isJs
    ? [...JS_SUFFIXES, ...TS_SUFFIXES, ...SFC_SUFFIXES]
    : [...TS_SUFFIXES, ...JS_SUFFIXES, ...SFC_SUFFIXES]
}

/**
 * The exact specifier Node needs, or null when nothing has to change:
 * external packages, already-explicit specifiers and unresolvable paths.
 */
function nativeSpecifier(root: string, fromFile: string, specifier: string): string | null {
  if (EXPLICIT_EXTENSION.test(specifier) || NON_PROJECT_SPECIFIER.test(specifier) || specifier.includes('?'))
    return null

  const base = projectTarget(root, fromFile, specifier)
  if (!base)
    return null

  for (const suffix of suffixCandidates(fromFile)) {
    if (isFile(base + suffix))
      return specifier + suffix
  }

  for (const suffix of INDEX_SUFFIXES) {
    if (isFile(path.join(base, `index${suffix}`)))
      return `${specifier}/index${suffix}`
  }

  return null
}

/** Specifier that points at the barrel, written in the same style as the original. */
function barrelSpecifier(root: string, fromFile: string, specifier: string, barrel: string): string {
  const match = matchPathAlias(specifier)
  const base = match ? path.resolve(root, match.alias.root) : path.dirname(fromFile)
  const relative = path.relative(base, barrel).replaceAll('\\', '/')
  if (match)
    return `${match.alias.prefix}/${relative}`
  return relative.startsWith('.') ? relative : `./${relative}`
}

/** Names a module exports, followed through nested barrels; null when a re-export hides them. */
function moduleExports(fromFile: string, seen = new Set<string>()): Set<string> | null {
  if (seen.has(fromFile))
    return new Set()
  seen.add(fromFile)

  const root = projectRootOf(fromFile) ?? path.dirname(fromFile)
  const code = readFileSync(fromFile, 'utf8')
  const names = new Set<string>()

  for (const match of code.matchAll(/export\s+(?:type\s+)?(\*|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/g)) {
    const clause = match[1]
    const target = projectTarget(root, fromFile, match[2])
    const nested = target && isFile(target) ? moduleExports(target, seen) : null

    if (clause === '*') {
      if (!nested)
        return null
      for (const name of nested)
        names.add(name)
      continue
    }

    // A named re-export is trustworthy even when its source cannot be enumerated.
    for (const part of clause.slice(1, -1).split(',')) {
      const spec = part.trim().replace(/^type\s+/u, '')
      if (!spec)
        continue
      const [imported, alias] = spec.split(/\s+as\s+/u)
      names.add((alias ?? imported).trim())
    }
  }

  for (const match of code.matchAll(/export\s+(?:declare\s+)?(?:const|let|var|function|class|interface|type|enum)\s+(\w+)/g))
    names.add(match[1])
  if (/export\s+default\b/u.test(code))
    names.add('default')

  return names
}

/** Imported names as the barrel would have to export them, or null when unverifiable. */
function importedNames(node: ImportDeclarationNode): string[] | null {
  const names: string[] = []
  for (const specifier of node.specifiers ?? []) {
    if (specifier.type === 'ImportNamespaceSpecifier')
      return null
    if (specifier.type === 'ImportDefaultSpecifier') {
      names.push('default')
      continue
    }
    const imported = specifier.imported
    if (!imported)
      return null
    const name = imported.type === 'Identifier' ? imported.name : imported.value
    if (typeof name !== 'string')
      return null
    names.push(name)
  }
  return names
}

function report(
  context: Rule.RuleContext,
  node: Rule.Node,
  messageId: string,
  data: Record<string, string>,
  specifier: string,
) {
  context.report({
    node,
    messageId,
    data,
    fix: (fixer) => {
      const [start, end] = context.sourceCode.getRange(node)
      return fixer.replaceTextRange([start + 1, end - 1], specifier)
    },
  })
}

function checkNative(context: Rule.RuleContext, literal: LiteralNode | undefined, specifier: unknown) {
  if (!literal || typeof specifier !== 'string')
    return
  const root = projectRootOf(context.filename)
  if (!root)
    return
  const desired = nativeSpecifier(root, context.filename, specifier)
  if (desired)
    report(context, literal as unknown as Rule.Node, 'nativeSpecifier', { desired }, desired)
}

function checkBarrel(context: Rule.RuleContext, node: ImportDeclarationNode) {
  const specifier = node.source?.value
  if (typeof specifier !== 'string' || NON_PROJECT_SPECIFIER.test(specifier) || specifier.includes('?'))
    return

  const root = projectRootOf(context.filename)
  if (!root)
    return
  const target = projectTarget(root, context.filename, specifier)
  if (!target || !isFile(target) || path.basename(target).startsWith('index.'))
    return

  // A barrel in the importing directory would close a cycle through its own index.ts.
  const dir = path.dirname(target)
  if (dir === path.dirname(context.filename))
    return

  const barrel = path.join(dir, 'index.ts')
  if (!isFile(barrel) || barrel === context.filename)
    return

  const names = importedNames(node)
  if (!names?.length)
    return

  const exported = moduleExports(barrel)
  if (!exported || !names.every(name => exported.has(name)))
    return

  const desired = barrelSpecifier(root, context.filename, specifier, barrel)
  if (desired !== specifier)
    report(context, node.source as unknown as Rule.Node, 'barrelImport', { desired }, desired)
}

export const nativeImportPath: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require internal imports to spell their full native ESM specifier',
    },
    fixable: 'code',
    schema: [],
    messages: {
      nativeSpecifier: 'Write the full native specifier: \'{{desired}}\'.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        checkNative(context, source, source?.value)
      },
      ExportNamedDeclaration(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        if (source)
          checkNative(context, source, source.value)
      },
      ExportAllDeclaration(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        checkNative(context, source, source?.value)
      },
      ImportExpression(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        if (source?.type === 'Literal')
          checkNative(context, source, source.value)
      },
      TSImportType(node: Rule.Node) {
        const { argument } = node as unknown as ImportTypeNode
        if (argument?.type === 'TSLiteralType' && argument.literal)
          checkNative(context, argument.literal, argument.literal.value)
        else if (argument?.type === 'Literal')
          checkNative(context, argument as LiteralNode, argument.value)
      },
      CallExpression(node: Rule.Node) {
        const { callee, arguments: args } = node as unknown as ImportingNode
        if (callee?.type !== 'MemberExpression' || callee.object?.name !== 'vi')
          return
        const [first] = args ?? []
        if (first?.type === 'Literal')
          checkNative(context, first, first.value)
      },
    }
  },
}

export const preferBarrelImport: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Import cross-directory modules through the directory barrel',
    },
    fixable: 'code',
    schema: [],
    messages: {
      barrelImport: 'Import through the directory barrel: \'{{desired}}\'.',
    },
  },
  create(context) {
    return {
      ImportDeclaration(node: Rule.Node) {
        checkBarrel(context, node as unknown as ImportDeclarationNode)
      },
    }
  },
}
