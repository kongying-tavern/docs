/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import {
  DEFAULT_TOAST_DURATION,
  isMotionPreference,
  isThemePreference,
  isToastPosition,
  TOAST_DURATION_DEFINITIONS,
  TOAST_POSITION_DEFINITIONS,
} from '../../config/settingsOptions'
import {
  applySitePreferences,
  DEFAULT_UI_FONT_SIZE,
  MAX_UI_FONT_SIZE,
  MIN_UI_FONT_SIZE,
  normalizeUiFontSize,
  resolveReducedMotion,
  sitePreferencesBootScript,
} from '../sitePreferences'

function createRoot(): HTMLElement {
  const properties = new Map<string, string>()
  return {
    dataset: {},
    style: {
      getPropertyValue: (name: string) => properties.get(name) ?? '',
      setProperty: (name: string, value: string) => properties.set(name, value),
    },
  } as unknown as HTMLElement
}

test('normalizes UI font sizes to the closest supported step', () => {
  assert.equal(normalizeUiFontSize('14'), DEFAULT_UI_FONT_SIZE)
  assert.equal(normalizeUiFontSize(15.6), DEFAULT_UI_FONT_SIZE)
  assert.equal(normalizeUiFontSize(13), MIN_UI_FONT_SIZE)
  assert.equal(normalizeUiFontSize(17), MAX_UI_FONT_SIZE)
  assert.equal(normalizeUiFontSize(1), MIN_UI_FONT_SIZE)
  assert.equal(normalizeUiFontSize(99), MAX_UI_FONT_SIZE)
  assert.equal(normalizeUiFontSize('invalid'), DEFAULT_UI_FONT_SIZE)
})

test('resolves reduced motion from the explicit three-state preference', () => {
  assert.equal(resolveReducedMotion('system', false), false)
  assert.equal(resolveReducedMotion('system', true), true)
  assert.equal(resolveReducedMotion('reduce', false), true)
  assert.equal(resolveReducedMotion('reduce', true), true)
  assert.equal(resolveReducedMotion('no-preference', false), false)
  assert.equal(resolveReducedMotion('no-preference', true), false)
})

test('settings option definitions remain valid storage values', () => {
  assert.equal(isThemePreference('auto'), true)
  assert.equal(isThemePreference('sepia'), false)
  assert.equal(isMotionPreference('reduce'), true)
  assert.equal(isMotionPreference('no-preference'), true)
  assert.equal(isMotionPreference('full'), false)
  assert.equal(isToastPosition('bottom-right'), true)
  assert.equal(isToastPosition('center'), false)

  assert.equal(new Set(TOAST_POSITION_DEFINITIONS.map(option => option.value)).size, TOAST_POSITION_DEFINITIONS.length)
  assert.equal(TOAST_DURATION_DEFINITIONS.some(option => option.value === DEFAULT_TOAST_DURATION), true)
})

test('applies font scaling only to the desktop interface', () => {
  const desktopRoot = createRoot()
  applySitePreferences(desktopRoot, {
    usePointerCursor: true,
    reducedMotion: true,
    uiFontSize: 18,
    desktop: true,
  })
  assert.equal(desktopRoot.dataset.pointerCursor, 'true')
  assert.equal(desktopRoot.dataset.reducedMotion, 'true')
  assert.equal(desktopRoot.dataset.uiFontSize, '18')
  assert.equal(desktopRoot.style.getPropertyValue('--site-ui-scale'), String(18 / DEFAULT_UI_FONT_SIZE))

  const mobileRoot = createRoot()
  applySitePreferences(mobileRoot, {
    usePointerCursor: true,
    reducedMotion: false,
    uiFontSize: 18,
    desktop: false,
  })
  assert.equal(mobileRoot.dataset.uiFontSize, String(DEFAULT_UI_FONT_SIZE))
  assert.equal(mobileRoot.style.getPropertyValue('--site-ui-scale'), '1')
})

test('boot script restores explicit motion and desktop font preferences', () => {
  const root = createRoot()
  const values: Record<string, string> = {
    'site-use-pointer-cursor': 'true',
    'site-motion-preference': 'no-preference',
    'site-ui-font-size': '18',
  }
  runInNewContext(sitePreferencesBootScript, {
    document: { documentElement: root },
    localStorage: { getItem: (key: string) => values[key] ?? null },
    matchMedia: (query: string) => ({ matches: query.includes('min-width') || query.includes('reduced-motion') }),
  })

  assert.equal(root.dataset.pointerCursor, 'true')
  assert.equal(root.dataset.reducedMotion, 'false')
  assert.equal(root.dataset.uiFontSize, '18')
  assert.equal(root.style.getPropertyValue('--site-ui-scale'), String(18 / DEFAULT_UI_FONT_SIZE))
})
