import type Token from 'markdown-it/lib/token.mjs'
import type { FontRole, FontSubsetConfig } from './config'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { load as loadYaml } from 'js-yaml'
import ts from 'typescript'
import { parse as parseSfc } from 'vue/compiler-sfc'

interface MarkdownParser {
  parse: (source: string, environment: Record<string, unknown>) => Token[]
}

type RoleSets = Map<FontRole, Set<number>>

interface VueNode {
  type: number
  tag?: string
  content?: string | VueNode
  children?: VueNode[]
  props?: VueProperty[]
  loc?: { source: string }
}

interface VueProperty {
  type: number
  name?: string
  value?: { content: string }
  arg?: VueNode
  exp?: VueNode
}

const WHITESPACE_RE = /\s+/
const LINE_BREAK_RE = /\r?\n/

export interface SiteFontCodepoints {
  [fileStem: string]: number[]
}

export function collectFiles(dir: string, extensions: ReadonlySet<string>): string[] {
  if (!existsSync(dir))
    return []

  const pending = [dir]
  const files: string[] = []
  while (pending.length) {
    const current = pending.pop()!
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name)
      if (entry.isDirectory())
        pending.push(path)
      else if (entry.isFile() && extensions.has(extname(entry.name)))
        files.push(path)
    }
  }
  return files.toSorted()
}

function addText(targets: RoleSets, roles: Iterable<FontRole>, text: string): void {
  for (const role of roles) {
    const codepoints = targets.get(role)
    if (!codepoints)
      throw new Error(`Unknown font role: ${role}`)
    for (const character of text)
      codepoints.add(character.codePointAt(0)!)
  }
}

function configuredRoles(
  tag: string | undefined,
  attributes: Iterable<string>,
  extraction: FontSubsetConfig['siteExtraction'],
): FontRole[] {
  const roles = new Set<FontRole>()
  if (tag && extraction.tagRoles[tag])
    roles.add(extraction.tagRoles[tag])

  for (const attribute of attributes) {
    for (const token of attribute.split(WHITESPACE_RE)) {
      const role = extraction.classRoles[token]
      if (role)
        roles.add(role)
    }
    for (const [variable, role] of Object.entries(extraction.fontVariableRoles)) {
      if (attribute.includes(variable))
        roles.add(role)
    }
  }
  return [...roles]
}

function extractScriptStrings(source: string, fileName: string): string[] {
  const kind = fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, kind)
  const strings: string[] = []
  const visit = (node: ts.Node): void => {
    if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) {
      strings.push(node.text)
    }
    else if (ts.isTemplateExpression(node)) {
      strings.push(node.head.text)
      for (const span of node.templateSpans)
        strings.push(span.literal.text)
    }
    ts.forEachChild(node, visit)
  }
  visit(sourceFile)
  return strings
}

function vueRoleText(property: VueProperty): string[] {
  if (property.type === 6) {
    return property.value && (property.name === 'class' || property.name === 'style')
      ? [property.value.content]
      : []
  }
  const argument = property.arg?.loc?.source
  if (argument !== 'class' && argument !== 'style')
    return []
  return [property.exp?.loc?.source].filter(
    (value): value is string => Boolean(value),
  )
}

function walkVueNode(
  node: VueNode,
  inheritedRoles: readonly FontRole[],
  targets: RoleSets,
  extraction: FontSubsetConfig['siteExtraction'],
): void {
  if (node.type === 2 && typeof node.content === 'string') {
    addText(targets, inheritedRoles, node.content)
    return
  }

  if (node.type === 5) {
    const expression = typeof node.content === 'object' ? node.content.loc?.source : undefined
    if (expression) {
      for (const text of extractScriptStrings(expression, 'template-expression.ts'))
        addText(targets, inheritedRoles, text)
    }
    return
  }

  const propertyText = (node.props ?? []).flatMap(vueRoleText)
  const explicitRoles = configuredRoles(node.tag, propertyText, extraction)
  const roles = explicitRoles.length > 0 ? explicitRoles : inheritedRoles

  for (const property of node.props ?? []) {
    if (
      property.type === 6
      && property.name
      && extraction.textAttributes.includes(property.name)
      && property.value
    ) {
      addText(targets, roles, property.value.content)
    }
  }
  for (const child of node.children ?? [])
    walkVueNode(child, roles, targets, extraction)
}

function extractVue(
  source: string,
  fileName: string,
  targets: RoleSets,
  extraction: FontSubsetConfig['siteExtraction'],
): void {
  const { descriptor, errors } = parseSfc(source, { filename: fileName })
  if (errors.length > 0)
    throw new Error(`Failed to parse Vue SFC ${fileName}: ${String(errors[0])}`)

  if (descriptor.template) {
    walkVueNode(
      descriptor.template.ast as VueNode,
      [extraction.defaultRole],
      targets,
      extraction,
    )
  }
  for (const script of [descriptor.script, descriptor.scriptSetup]) {
    if (!script)
      continue
    for (const text of extractScriptStrings(script.content, fileName))
      addText(targets, [extraction.sharedRole], text)
  }
}

function extractHtmlFragment(
  source: string,
  inheritedRoles: readonly FontRole[],
  targets: RoleSets,
  extraction: FontSubsetConfig['siteExtraction'],
): void {
  const { descriptor, errors } = parseSfc(`<template>${source}</template>`)
  if (errors.length > 0 || !descriptor.template) {
    addText(targets, inheritedRoles, source)
    return
  }
  walkVueNode(descriptor.template.ast as VueNode, inheritedRoles, targets, extraction)
}

function tokenAttributes(token: Token): string[] {
  return (token.attrs ?? [])
    .filter(([name]) => name === 'class' || name === 'style')
    .map(([, value]) => String(value ?? ''))
}

function walkMarkdownTokens(
  tokens: Token[],
  initialRoles: readonly FontRole[],
  targets: RoleSets,
  extraction: FontSubsetConfig['siteExtraction'],
): void {
  const stack: (readonly FontRole[])[] = [initialRoles]
  for (const token of tokens) {
    if (token.nesting === -1) {
      if (stack.length > 1)
        stack.pop()
      continue
    }

    const inheritedRoles = stack.at(-1)!
    const explicitRoles = configuredRoles(token.tag, tokenAttributes(token), extraction)
    const roles = explicitRoles.length > 0 ? explicitRoles : inheritedRoles
    if (token.nesting === 1)
      stack.push(roles)

    if (token.type === 'text')
      addText(targets, roles, token.content)
    else if (token.type === 'image')
      addText(targets, roles, token.content)
    else if (token.type === 'html_block')
      extractHtmlFragment(token.content, roles, targets, extraction)
    else if (token.children)
      walkMarkdownTokens(token.children, roles, targets, extraction)
  }
}

function splitFrontmatter(source: string): { body: string, data: unknown } {
  const lines = source.split(LINE_BREAK_RE)
  if (lines[0]?.trim() !== '---')
    return { body: source, data: undefined }
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (end === -1)
    return { body: source, data: undefined }
  return {
    body: lines.slice(end + 1).join('\n'),
    data: loadYaml(lines.slice(1, end).join('\n')),
  }
}

function walkFrontmatter(
  value: unknown,
  path: string,
  targets: RoleSets,
  extraction: FontSubsetConfig['siteExtraction'],
): void {
  if (typeof value === 'string') {
    addText(
      targets,
      [extraction.frontmatterRoles[path] ?? extraction.sharedRole],
      value,
    )
    return
  }
  if (Array.isArray(value)) {
    for (const item of value)
      walkFrontmatter(item, path, targets, extraction)
    return
  }
  if (!value || typeof value !== 'object')
    return
  for (const [key, child] of Object.entries(value))
    walkFrontmatter(child, path ? `${path}.${key}` : key, targets, extraction)
}

function extractMarkdown(
  source: string,
  fileName: string,
  parser: MarkdownParser,
  targets: RoleSets,
  extraction: FontSubsetConfig['siteExtraction'],
): void {
  const { body, data } = splitFrontmatter(source)
  walkFrontmatter(data, '', targets, extraction)
  const tokens = parser.parse(body, { path: fileName })
  walkMarkdownTokens(tokens, [extraction.defaultRole], targets, extraction)
}

function walkJson(value: unknown, targets: RoleSets, sharedRole: FontRole): void {
  if (typeof value === 'string') {
    addText(targets, [sharedRole], value)
    return
  }
  if (Array.isArray(value)) {
    for (const item of value)
      walkJson(item, targets, sharedRole)
    return
  }
  if (!value || typeof value !== 'object')
    return
  for (const [key, child] of Object.entries(value)) {
    addText(targets, [sharedRole], key)
    walkJson(child, targets, sharedRole)
  }
}

function extractorFor(
  extension: string,
  config: FontSubsetConfig['siteExtraction'],
): keyof FontSubsetConfig['siteExtraction']['extensions'] {
  for (const [extractor, extensions] of Object.entries(config.extensions)) {
    if (extensions.includes(extension))
      return extractor as keyof FontSubsetConfig['siteExtraction']['extensions']
  }
  throw new Error(`No character extractor is configured for ${extension}`)
}

export async function collectSiteCodepoints(
  projectRoot: string,
  config: FontSubsetConfig,
  markdown: MarkdownParser,
): Promise<SiteFontCodepoints> {
  const targets: RoleSets = new Map(
    config.siteExtraction.roles.map(role => [role, new Set<number>()]),
  )

  for (const entry of config.scan) {
    const extensions = new Set(entry.extensions)
    for (const file of collectFiles(resolve(projectRoot, entry.path), extensions)) {
      const source = readFileSync(file, 'utf8')
      switch (extractorFor(extname(file), config.siteExtraction)) {
        case 'markdown':
          extractMarkdown(source, file, markdown, targets, config.siteExtraction)
          break
        case 'vue':
          extractVue(source, file, targets, config.siteExtraction)
          break
        case 'script':
          for (const text of extractScriptStrings(source, file))
            addText(targets, [config.siteExtraction.sharedRole], text)
          break
        case 'json':
          walkJson(JSON.parse(source), targets, config.siteExtraction.sharedRole)
          break
      }
    }
  }

  return Object.fromEntries(config.fonts.map((font) => {
    const codepoints = new Set<number>()
    for (const role of font.siteRoles) {
      for (const codepoint of targets.get(role) ?? [])
        codepoints.add(codepoint)
    }
    return [font.fileStem, [...codepoints].toSorted((left, right) => left - right)]
  }))
}
