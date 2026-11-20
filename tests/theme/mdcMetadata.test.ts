import { existsSync } from 'node:fs'
import { expect, test } from 'vitest'
import { resolveGlobalComponents } from '~/plugins/mdc-metadata.ts'

const UI_BARREL_EXPORTS = [
  'AccordionPanels',
  'Avatar',
  'Button',
  'Divider',
  'Emoji',
  'EmojiPicker',
  'InputPlaceholders',
  'LazyImage',
  'LinkGrid',
  'MentionPicker',
  'Separator',
  'User',
]

test('resolves ui barrel exports whether they route through a directory or a .vue file', () => {
  const components = resolveGlobalComponents()

  for (const name of UI_BARREL_EXPORTS)
    expect(components.has(name), `${name} is missing from the MDC registry`).toBe(true)

  for (const [name, file] of components)
    expect(existsSync(file), `${name} resolves to a missing file: ${file}`).toBe(true)
})

test('keeps page-level components out of the registry', () => {
  // `theme/index.ts` registers SettingsPage from the `@/` alias. Only theme-internal
  // imports become MDC entries, so page components stay Vite's business.
  expect(resolveGlobalComponents().has('SettingsPage')).toBe(false)
})
