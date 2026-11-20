import { existsSync } from 'node:fs'
import { expect, test } from 'vitest'
import { MDC_COMPONENTS, resolveGlobalComponents } from '~/plugins/mdc-metadata.ts'

test('resolves every whitelisted ui component through its directory barrel', () => {
  const components = resolveGlobalComponents()

  for (const name of MDC_COMPONENTS)
    expect(components.has(name), `${name} is missing from the MDC registry`).toBe(true)

  for (const [name, file] of components)
    expect(existsSync(file), `${name} resolves to a missing file: ${file}`).toBe(true)
})

test('keeps non-whitelisted ui components out of the registry', () => {
  // The ui barrel exports the whole layer; only `MDC_COMPONENTS` may become MDC tags.
  const components = resolveGlobalComponents()

  for (const name of ['Accordion', 'Breadcrumb', 'Switch', 'Table'])
    expect(components.has(name), `${name} must not be an MDC tag`).toBe(false)
})

test('keeps page-level components out of the registry', () => {
  // `theme/index.ts` registers SettingsPage from the `@/` alias. Only theme-internal
  // imports become MDC entries, so page components stay Vite's business.
  expect(resolveGlobalComponents().has('SettingsPage')).toBe(false)
})
