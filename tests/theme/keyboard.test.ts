import assert from 'node:assert/strict'
import { test } from 'vitest'
import { detectShortcutPlatform, resolveShortcutKey } from '../../.vitepress/theme/lib/keyboard'

test('platform detection has safe fallbacks for Apple, Windows, Linux and unknown clients', () => {
  for (const platform of ['MacIntel', 'iPhone', 'iPad'])
    assert.equal(detectShortcutPlatform({ platform }), 'mac')
  assert.equal(detectShortcutPlatform({ platform: 'Win32' }), 'windows')
  assert.equal(detectShortcutPlatform({ platform: 'Linux x86_64' }), 'linux')
  assert.equal(detectShortcutPlatform({ platform: 'Win32', userAgentData: { platform: 'macOS' } }), 'mac')
  assert.equal(detectShortcutPlatform({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)' }), 'mac')
  assert.equal(detectShortcutPlatform({}), 'unknown')
})

test('Mod adapts while explicit Control, Command and system keys preserve their meaning', () => {
  assert.deepEqual(resolveShortcutKey('Mod', 'unknown'), { label: 'Ctrl / ⌘', name: 'Control / Command' })
  assert.deepEqual(resolveShortcutKey('Mod', 'mac'), { label: '⌘', name: 'Command' })
  for (const platform of ['windows', 'linux'] as const)
    assert.deepEqual(resolveShortcutKey('Mod', platform), { label: 'Ctrl', name: 'Control' })
  assert.deepEqual(resolveShortcutKey('Ctrl', 'mac'), { label: '⌃', name: 'Control' })
  assert.equal(resolveShortcutKey('Command', 'windows').label, '⌘')
  assert.equal(resolveShortcutKey('Meta', 'windows').name, 'Windows')
  assert.equal(resolveShortcutKey('Meta', 'mac').name, 'Command')
  assert.equal(resolveShortcutKey('Meta', 'linux').label, 'Meta')
  assert.equal(resolveShortcutKey('Win', 'mac').name, 'Windows')
})

test('aliases, literal punctuation and unknown names remain readable without guessing key layouts', () => {
  for (const key of ['Up', 'ArrowUp', 'ArrUp', 'arrup', '↑'])
    assert.deepEqual(resolveShortcutKey(key, 'windows'), { label: '↑', name: 'Arrow Up' })
  assert.deepEqual(resolveShortcutKey('pLuS', 'windows'), { label: '+', name: 'Plus' })
  assert.deepEqual(resolveShortcutKey('Comma', 'mac'), { label: ',', name: 'Comma' })
  assert.equal(resolveShortcutKey('Backslash', 'unknown').label, '\\')
  assert.equal(resolveShortcutKey('BracketRight', 'unknown').label, ']')
  assert.equal(resolveShortcutKey('  cMd ', 'mac').label, '⌘')
  assert.equal(resolveShortcutKey('g', 'linux').label, 'G')
  assert.equal(resolveShortcutKey('f12', 'linux').label, 'F12')
  assert.equal(resolveShortcutKey('Numpad7', 'mac').label, 'Numpad7')
  assert.equal(resolveShortcutKey('@', 'windows').label, '@')
  assert.equal(resolveShortcutKey('<b>{{name}}</b>', 'mac').label, '<b>{{name}}</b>')
  for (const key of ['constructor', 'toString', '__proto__'])
    assert.deepEqual(resolveShortcutKey(key, 'mac'), { label: key, name: key })
})
