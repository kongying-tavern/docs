import { existsSync } from 'node:fs'
import { expect, test } from 'vitest'
import { resolveGlobalComponents, resolveMdcAllowlist } from '../../../../.vitepress/plugins/mdc-metadata.ts'

test('resolves every whitelisted ui component through its directory barrel', () => {
  const allowlist = resolveMdcAllowlist()
  const components = resolveGlobalComponents()

  // A missing or emptied allowlist would silently drop the ui tags from the registry.
  expect(allowlist.size).toBe(12)

  for (const name of allowlist)
    expect(components.has(name), `${name} is missing from the MDC registry`).toBe(true)

  for (const [name, file] of components)
    expect(existsSync(file), `${name} resolves to a missing file: ${file}`).toBe(true)
})

test('keeps non-whitelisted ui components out of the registry', () => {
  // The ui barrel exports the whole layer; `ui/mdc.ts` is the only way in.
  const components = resolveGlobalComponents()

  for (const name of ['Accordion', 'Breadcrumb', 'Switch', 'Table'])
    expect(components.has(name), `${name} must not be an MDC tag`).toBe(false)
})

test('keeps page-level components out of the registry', () => {
  // `theme/index.ts` registers SettingsPage from the `@/` alias. Only theme-internal
  // imports become MDC entries, so page components stay Vite's business.
  expect(resolveGlobalComponents().has('SettingsPage')).toBe(false)
})
