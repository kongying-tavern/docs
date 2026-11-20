import type { Plugin } from 'vite'
import type { ComponentMeta } from 'vue-component-meta'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizePath } from 'vite'
import { createCheckerByJson } from 'vue-component-meta'
import { matchPathAlias, THEME_ALIAS } from '../config/aliases.ts'

const currentDir = fileURLToPath(new URL('.', import.meta.url))
const projectRoot = resolve(currentDir, '..', '..')
const outFile = resolve(projectRoot, '.vitepress/theme/mdc-components.gen.mjs')
const themeEntry = normalizePath(resolve(projectRoot, '.vitepress/theme/index.ts'))
const themeDir = resolve(themeEntry, '..')
const compDir = normalizePath(resolve(projectRoot, '.vitepress/theme/components'))
const PASCAL_BOUNDARY_RE = /([a-z0-9])([A-Z])/g
const BARREL_EXPORT_RE = /export\s*\{\s*default\s+as\s+(\w+)\s*\}\s*from\s*['"](.+\.vue)['"]/g
const NAMED_EXPORT_RE = /export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g
const COMPONENT_IMPORT_RE = /import\s+(\w+)\s+from\s+['"](.+\.vue)['"]/g
const GLOBAL_REGISTRATION_RE = /app\.component\s*\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g

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

/** `default as Foo, Bar` → [`Foo`, `Bar`]; tolerates `type` modifiers and renames. */
function exportClauseNames(clause: string): string[] {
  return clause.split(',')
    .map(part => part.trim().replace(/^type\s+/, '').replace(/^default\s+as\s+/, ''))
    .filter(Boolean)
}

/** Parse the theme barrel and index.ts to find globally-registered component file paths. */
export function resolveGlobalComponents(): Map<string, string> {
  const components = new Map<string, string>()

  // 1. ui/index.ts barrel: `export { default as Foo } from './Foo.vue'`, or a
  //    named re-export routed through the component directory: `export { Foo } from './foo/index.ts'`
  const uiIndex = resolve(compDir, 'ui/index.ts')
  if (existsSync(uiIndex)) {
    const src = readFileSync(uiIndex, 'utf-8')
    for (const m of src.matchAll(NAMED_EXPORT_RE)) {
      const names = exportClauseNames(m[1])
      const specifier = m[2]
      if (specifier.endsWith('.vue')) {
        for (const name of names)
          components.set(name, resolve(resolve(uiIndex, '..'), specifier))
        continue
      }
      // Directory barrel: resolve each requested name through its index.ts.
      const barrel = specifier.endsWith('/index.ts')
        ? resolve(resolve(uiIndex, '..'), specifier)
        : resolve(resolve(uiIndex, '..'), specifier, 'index.ts')
      if (!existsSync(barrel))
        continue
      for (const inner of readFileSync(barrel, 'utf-8').matchAll(BARREL_EXPORT_RE)) {
        if (names.includes(inner[1]))
          components.set(inner[1], resolve(resolve(barrel, '..'), inner[2]))
      }
    }
  }

  // 2. theme/index.ts: individually registered via app.component('Name', Binding)
  if (existsSync(themeEntry)) {
    const src = readFileSync(themeEntry, 'utf-8')
    const importMap = new Map<string, string>()

    for (const m of src.matchAll(COMPONENT_IMPORT_RE)) {
      let specifier = m[2]
      const alias = matchPathAlias(specifier)
      // Only theme-internal imports join the registry; page-level components that
      // are registered globally keep being resolved by Vite, not by this generator.
      if (alias?.alias === THEME_ALIAS)
        specifier = resolve(projectRoot, alias.alias.root, alias.rest)
      else if (specifier.startsWith('.'))
        specifier = resolve(themeDir, specifier)
      else continue
      importMap.set(m[1], specifier)
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
      if (ctx.file.startsWith(`${compDir}/`) || ctx.file === themeEntry)
        generate()
    },
  }
}
