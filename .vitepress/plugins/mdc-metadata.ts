import type { Plugin } from 'vite'
import type { ComponentMeta } from 'vue-component-meta'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizePath } from 'vite'
import { createCheckerByJson } from 'vue-component-meta'
import { matchPathAlias, THEME_ALIAS } from '../config/aliases.ts'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(currentDir, '..', '..')
const outFile = resolve(projectRoot, '.vitepress/theme/mdc-components.gen.mjs')
const themeEntry = normalizePath(resolve(projectRoot, '.vitepress/theme/index.ts'))
// 组件注册拆进 lib 下的两个模块，index.ts 只调用它们；三份都要扫，缺一份就会漏标签。
const registrationEntries = [
  themeEntry,
  normalizePath(resolve(projectRoot, '.vitepress/theme/lib/markdownComponents.ts')),
  normalizePath(resolve(projectRoot, '.vitepress/theme/lib/layoutComponents.ts')),
]
const compDir = normalizePath(resolve(projectRoot, '.vitepress/theme/components'))
const PASCAL_BOUNDARY_RE = /([a-z0-9])([A-Z])/g
const BARREL_EXPORT_RE = /^[ \t]*export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*['"](.+\.vue)['"]/gm
const IMPORT_RE = /^import\s+(?:(type)\s+)?(\{[^}]*\}|[\w$]+(?:\s*,\s*\{[^}]*\})?)\s+from\s+['"]([^'"]+)['"]/gm
const ASYNC_COMPONENT_RE = /const\s+(\w+)\s*=\s*defineAsyncComponent\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)\s*\)/g
const GLOBAL_REGISTRATION_RE = /app\.component\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g

const mdcAllowlistFile = normalizePath(resolve(compDir, 'ui/mdc.ts'))
// Anchored to the line start so a comment showing `export { ... } from '...'` is not
// mistaken for a real entry.
const MDC_EXPORT_RE = /^[ \t]*export\s*\{([^}]+)\}\s*from\s*['"]/gm

const SKIP_PROPS = new Set([
  'key',
  'ref',
  'ref_for',
  'class',
  'style',
  'id',
  'onVnodeMounted',
  'onVnodeUpdated',
  'onVnodeUnmounted',
  'onVnodeBeforeMount',
  'onVnodeBeforeUpdate',
])

interface MdcProp { name: string, type: string, required: boolean, description: string }
interface MdcComponentEntry { mdc_name: string, component_meta: { meta: { props: MdcProp[] } } }

function pascalToKebab(name: string): string {
  return name.replace(PASCAL_BOUNDARY_RE, '$1-$2').toLowerCase()
}

function extractProps(meta: ComponentMeta): MdcProp[] {
  return meta.props
    .filter(p => !p.global && !SKIP_PROPS.has(p.name))
    .map(p => ({
      name: p.name,
      type: p.type || 'any',
      required: Boolean(p.required),
      description: p.description || '',
    }))
}

/**
 * The MDC allowlist, parsed from `components/ui/mdc.ts`.
 * The module is never imported: its `.vue` re-exports must stay out of the Node graph.
 */
export function resolveMdcAllowlist(): Set<string> {
  const names = new Set<string>()
  if (!existsSync(mdcAllowlistFile))
    return names

  for (const m of readFileSync(mdcAllowlistFile, 'utf-8').matchAll(MDC_EXPORT_RE)) {
    for (const part of m[1].split(',')) {
      const cleaned = part.trim().replace(/^type\s+/, '')
      if (cleaned)
        names.add(cleaned.split(/\s+as\s+/).pop()!.trim())
    }
  }

  return names
}

/** Every component re-exported by a per-component barrel under `components/ui`. */
function resolveUiComponents(): Map<string, string> {
  const components = new Map<string, string>()
  const uiDir = resolve(compDir, 'ui')

  for (const entry of readdirSync(uiDir, { withFileTypes: true })) {
    if (!entry.isDirectory())
      continue
    const barrel = resolve(uiDir, entry.name, 'index.ts')
    if (!existsSync(barrel))
      continue
    for (const m of readFileSync(barrel, 'utf-8').matchAll(BARREL_EXPORT_RE))
      components.set(m[1], resolve(resolve(barrel, '..'), m[2]))
  }

  return components
}

/** Local bindings introduced by an import clause: `Foo`, `{ Bar, Baz as Qux }`. */
function importedBindings(clause: string): string[] {
  const bindings: string[] = []
  const named = clause.match(/\{([^}]*)\}/)

  if (named) {
    for (const part of named[1].split(',')) {
      const cleaned = part.trim().replace(/^type\s+/, '')
      if (!cleaned)
        continue
      bindings.push(cleaned.split(/\s+as\s+/).pop()!.trim())
    }
  }

  const defaultBinding = clause.replace(/\{[^}]*\}/, '').split(',')[0].trim()
  if (defaultBinding)
    bindings.push(defaultBinding)

  return bindings
}

/** Absolute path of a theme-internal specifier; page-level and external ones yield `undefined`. */
function resolveModulePath(specifier: string, fromDir: string): string | undefined {
  const alias = matchPathAlias(specifier)
  let base: string

  if (alias?.alias === THEME_ALIAS)
    base = resolve(projectRoot, alias.alias.root, alias.rest)
  else if (specifier.startsWith('.'))
    base = resolve(fromDir, specifier)
  else
    return undefined

  if (base.endsWith('.vue'))
    return existsSync(base) ? base : undefined

  return [base, `${base}.ts`, join(base, 'index.ts')].find(path => existsSync(path))
}

/** The `.vue` file a module exposes under `binding`, following its directory barrel. */
function resolveComponentFile(specifier: string, binding: string, fromDir: string): string | undefined {
  const modulePath = resolveModulePath(specifier, fromDir)
  if (!modulePath)
    return undefined
  if (modulePath.endsWith('.vue'))
    return modulePath

  for (const m of readFileSync(modulePath, 'utf-8').matchAll(BARREL_EXPORT_RE)) {
    if (m[1] === binding)
      return resolve(resolve(modulePath, '..'), m[2])
  }

  return undefined
}

/** Resolve the globally-registered component files that Markdown can reach as MDC tags. */
export function resolveGlobalComponents(): Map<string, string> {
  const components = new Map<string, string>()

  // 1. ui barrels: the barrel exports the whole ui layer, `ui/mdc.ts` narrows it
  //    down to the tags authors are allowed to use.
  const allowlist = resolveMdcAllowlist()
  for (const [name, file] of resolveUiComponents()) {
    if (allowlist.has(name))
      components.set(name, file)
  }

  // 2. 全局注册处：`app.component('Name', Binding)`，见 theme/lib/*Components.ts
  for (const entry of registrationEntries) {
    if (!existsSync(entry))
      continue
    const src = readFileSync(entry, 'utf-8')
    // 相对路径按各自文件所在目录解析，注册模块换位置不用改这里。
    const entryDir = dirname(entry)
    const importMap = new Map<string, string>()

    // Only theme-internal imports join the registry; page-level components that are
    // registered globally keep being resolved by Vite, not by this generator.
    for (const m of src.matchAll(IMPORT_RE)) {
      if (m[1])
        continue
      for (const binding of importedBindings(m[2])) {
        const file = resolveComponentFile(m[3], binding, entryDir)
        if (file)
          importMap.set(binding, file)
      }
    }

    // `const Foo = defineAsyncComponent(() => import('./Foo.vue'))`
    for (const m of src.matchAll(ASYNC_COMPONENT_RE)) {
      const file = resolveModulePath(m[2], entryDir)
      if (file)
        importMap.set(m[1], file)
    }

    for (const m of src.matchAll(GLOBAL_REGISTRATION_RE)) {
      const resolved = importMap.get(m[2])
      if (resolved)
        components.set(m[1], resolved)
    }
  }

  return components
}

function generate(): void {
  const components = resolveGlobalComponents()
  const entries: MdcComponentEntry[] = []
  if (components.size > 0) {
    const paths = [...components.values()]
    const checker = createCheckerByJson(
      projectRoot,
      { extends: join(projectRoot, 'tsconfig.json'), skipLibCheck: true, include: paths },
      { forceUseTs: true, schema: false },
    )

    for (const [name, fullPath] of components) {
      if (!existsSync(fullPath))
        continue
      const meta = checker.getComponentMeta(fullPath)
      const props = extractProps(meta)
      entries.push({ mdc_name: pascalToKebab(name), component_meta: { meta: { props } } })
    }
  }
  entries.sort((a, b) => a.mdc_name.localeCompare(b.mdc_name))

  if (!existsSync(resolve(projectRoot, '.vitepress/theme')))
    mkdirSync(resolve(projectRoot, '.vitepress/theme'), { recursive: true })

  writeFileSync(
    outFile,
    `// Auto-generated by vitepress-plugin-mdc-metadata. DO NOT EDIT.\n// Regenerates on dev start & component file changes.\nexport default ${JSON.stringify(entries, null, 2)}\n`,
    'utf-8',
  )
}

export function mdcMetadataPlugin(): Plugin {
  let generated = false

  return {
    name: 'vite-plugin-mdc-metadata',
    apply: 'serve',

    async buildStart() {
      if (!generated) {
        generate()
        generated = true
      }
    },

    async hotUpdate(ctx) {
      // The metadata is shared by all environments; regenerate once per edit.
      if (this.environment.name !== 'client')
        return
      if (ctx.file.startsWith(`${compDir}/`) || registrationEntries.includes(ctx.file))
        generate()
    },
  }
}
