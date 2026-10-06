import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { matchesShortcut, normalizeShortcut, normalizeShortcutPreferences, resolveEditorShortcut, resolveShortcut, shortcutBindingError, shortcutFromEvent } from '../../src/forum/services/forumShortcuts'

const defaults = { overrides: {} }
const key = (value: string, modifiers: Partial<{ ctrlKey: boolean, metaKey: boolean, altKey: boolean, shiftKey: boolean }> = {}) => ({ key: value, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, ...modifiers })

test('bindings normalize modifier order and reject malformed combinations', () => {
  assert.equal(normalizeShortcut('Shift+Mod+B'), 'Mod+Shift+B')
  for (const invalid of ['Mod+Mod+B', 'Mod+Ctrl+B', 'Tab', 'Escape', 'Ctrl+', 'A+B', 'ctrl+B', 12, null])
    assert.equal(normalizeShortcut(invalid), null)
  assert.equal(normalizeShortcut(''), '')
})

test('primary modifier adapts across platforms and requires exact modifiers', () => {
  assert.equal(matchesShortcut('Mod+B', key('b', { ctrlKey: true })), true)
  assert.equal(matchesShortcut('Mod+B', key('b', { metaKey: true })), true)
  assert.equal(matchesShortcut('Mod+B', key('b', { ctrlKey: true, metaKey: true })), false)
  assert.equal(matchesShortcut('Mod+B', key('B', { ctrlKey: true, shiftKey: true })), false)
  assert.equal(matchesShortcut('Mod+B', key('b', { ctrlKey: true, altKey: true })), false)
  assert.equal(matchesShortcut('', key('b')), false)
  assert.equal(matchesShortcut('/', key('/')), true)
})

test('recording uses portable primary modifiers and preserves explicit alternatives', () => {
  assert.equal(shortcutFromEvent(key('B', { ctrlKey: true, shiftKey: true }), false), 'Mod+Shift+B')
  assert.equal(shortcutFromEvent(key('b', { metaKey: true }), true), 'Mod+B')
  assert.equal(shortcutFromEvent(key('b', { ctrlKey: true }), true), 'Ctrl+B')
  assert.equal(shortcutFromEvent(key('Control'), false), null)
})

test('local preferences preserve disabled bindings and recover from unknown or corrupt data', () => {
  const preferences = normalizeShortcutPreferences({ overrides: {
    bold: { enabled: false, binding: 'Mod+Shift+B' },
    italic: { enabled: true, binding: 'Mod+Ctrl+I' },
    search: { enabled: true, binding: '' },
    unknownAction: { enabled: true, binding: 'Mod+Q' },
  } })
  assert.deepEqual(resolveShortcut(preferences, 'bold'), { enabled: false, binding: 'Mod+Shift+B' })
  assert.equal(resolveShortcut(preferences, 'italic').binding, 'Mod+I')
  assert.equal(resolveShortcut(preferences, 'search').binding, '')
  assert.deepEqual(Object.keys(preferences.overrides), ['bold', 'search'])
  assert.deepEqual(normalizeShortcutPreferences(null), defaults)
})

test('application bindings conflict across platforms while editor scope can reuse them', () => {
  const preferences = { overrides: { settings: { enabled: true, binding: 'Mod+Shift+Y' } } }
  assert.equal(shortcutBindingError('publish', 'Ctrl+Shift+Y', preferences), 'settings')
  assert.equal(shortcutBindingError('publish', 'Meta+Shift+Y', preferences), 'settings')
  assert.equal(shortcutBindingError('bold', 'Mod+Shift+Y', preferences), null)
  preferences.overrides.settings.enabled = false
  assert.equal(shortcutBindingError('publish', 'Mod+Shift+Y', preferences), null)
  assert.equal(shortcutBindingError('italic', 'Mod+B', defaults), 'bold')
})

test('enabled editor actions can reuse disabled bindings', () => {
  const preferences = { overrides: {
    bold: { enabled: false, binding: 'Mod+B' },
    italic: { enabled: true, binding: 'Mod+B' },
  } }
  assert.equal(shortcutBindingError('italic', 'Mod+B', preferences), null)
  assert.deepEqual(resolveEditorShortcut(preferences, key('b', { ctrlKey: true }), true), { id: 'italic', enabled: true })
  assert.deepEqual(resolveEditorShortcut(preferences, key('b', { metaKey: true }), true), { id: 'italic', enabled: true })
})

test('native controls and common browser keys are protected', () => {
  for (const binding of ['Mod+L', 'Mod+R', 'Mod+V', 'Alt+ArrowLeft', 'A', 'Enter'])
    assert.equal(shortcutBindingError('publish', binding, defaults), 'reserved')
  assert.equal(shortcutBindingError('search', '/', defaults), null)
  assert.equal(shortcutBindingError('publish', '/', defaults), 'reserved')
  assert.equal(shortcutBindingError('send', 'Mod+Enter', defaults), null)
  assert.equal(shortcutBindingError('settings', '', defaults), null)
})

test('disabled custom editor keys and old defaults cannot fall through to StarterKit commands', () => {
  const preferences = { overrides: { bold: { enabled: false, binding: 'Mod+Shift+B' } } }
  assert.deepEqual(resolveEditorShortcut(preferences, key('B', { ctrlKey: true, shiftKey: true }), true), { id: 'bold', enabled: false })
  assert.deepEqual(resolveEditorShortcut(preferences, key('b', { ctrlKey: true }), true), { id: 'bold', enabled: false })
  preferences.overrides.bold.enabled = true
  assert.deepEqual(resolveEditorShortcut(preferences, key('B', { ctrlKey: true, shiftKey: true }), true), { id: 'bold', enabled: true })
  assert.equal(resolveEditorShortcut(defaults, key('Enter', { ctrlKey: true }), false), null)
  assert.deepEqual(resolveEditorShortcut(defaults, key('Enter', { ctrlKey: true }), true), { id: 'send', enabled: true })
  assert.equal(resolveEditorShortcut(defaults, key('Enter'), true), null)
})
