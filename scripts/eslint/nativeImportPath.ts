import type { Rule } from 'eslint'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Native ESM requires fully specified specifiers: an explicit file extension and
 * no directory `index` shorthand. This rule rewrites internal specifiers to the
 * exact file they resolve to, so every module also stays loadable by plain Node.
 */

interface LiteralNode {
  type: string
  value: unknown
}

interface ImportingNode {
  source?: LiteralNode
  callee?: { type: string, object?: { name?: string } }
  arguments?: LiteralNode[]
  argument?: LiteralNode
}

const ALIASES: readonly (readonly [string, string])[] = [
  ['@theme/', '.vitepress/theme/'],
  ['~/', '.vitepress/'],
  ['@/', ''],
]

const FILE_SUFFIXES = ['.ts', '.d.ts', '.mts', '.tsx', '.vue'] as const
const INDEX_SUFFIXES = ['.ts', '.vue'] as const
const EXPLICIT_EXTENSION = /\.(?:[cm]?[jt]sx?|vue|css|json|ya?ml|svg|png|jpe?g|webp|avif|gif|woff2?|txt)$/i
const SKIPPED_SPECIFIER = /^(?:[a-z][\w+.-]*:|#|\/)/i

const roots = new Map<string, string | null>()

function projectRoot(fromFile: string): string | null {
  const start = path.dirname(fromFile)
  if (roots.has(start))
    return roots.get(start) ?? null
  let dir = start
  let found: string | null = null
  while (true) {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
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
    return fs.statSync(target).isFile()
  }
  catch {
    return false
  }
}

function baseTarget(root: string, fromFile: string, specifier: string): string | null {
  if (specifier.startsWith('.'))
    return path.resolve(path.dirname(fromFile), specifier)
  for (const [alias, dir] of ALIASES) {
    if (specifier.startsWith(alias))
      return path.resolve(root, dir + specifier.slice(alias.length))
  }
  return null
}

function nativeSpecifier(root: string, fromFile: string, specifier: string): string | null {
  if (EXPLICIT_EXTENSION.test(specifier) || SKIPPED_SPECIFIER.test(specifier) || specifier.includes('?'))
    return null

  const base = baseTarget(root, fromFile, specifier)
  if (!base)
    return null

  for (const suffix of FILE_SUFFIXES) {
    if (isFile(base + suffix))
      return specifier + suffix
  }

  for (const suffix of INDEX_SUFFIXES) {
    if (isFile(path.join(base, `index${suffix}`)))
      return `${specifier}/index${suffix}`
  }

  return null
}

function check(context: Rule.RuleContext, literal: LiteralNode | undefined, specifier: unknown) {
  if (!literal || typeof specifier !== 'string')
    return
  const root = projectRoot(context.filename)
  if (!root)
    return
  const desired = nativeSpecifier(root, context.filename, specifier)
  if (!desired || desired === specifier)
    return

  const node = literal as unknown as Rule.Node

  context.report({
    node,
    messageId: 'nativeSpecifier',
    data: { desired },
    fix: (fixer) => {
      const [start, end] = context.sourceCode.getRange(node)
      return fixer.replaceTextRange([start + 1, end - 1], desired)
    },
  })
}

const rule: Rule.RuleModule = {
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
        check(context, source, source?.value)
      },
      ExportNamedDeclaration(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        if (source)
          check(context, source, source.value)
      },
      ExportAllDeclaration(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        check(context, source, source?.value)
      },
      ImportExpression(node: Rule.Node) {
        const { source } = node as unknown as ImportingNode
        if (source?.type === 'Literal')
          check(context, source, source.value)
      },
      TSImportType(node: Rule.Node) {
        const { argument } = node as unknown as ImportingNode
        if (argument?.type === 'Literal')
          check(context, argument, argument.value)
      },
      CallExpression(node: Rule.Node) {
        const { callee, arguments: args } = node as unknown as ImportingNode
        if (callee?.type !== 'MemberExpression' || callee.object?.name !== 'vi')
          return
        const [first] = args ?? []
        if (first?.type === 'Literal')
          check(context, first, first.value)
      },
    }
  },
}

export default rule
