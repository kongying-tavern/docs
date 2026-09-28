import type { MotionPreference } from '~/config/settingsOptions'

export type { MotionPreference } from '~/config/settingsOptions'

export const POINTER_CURSOR_STORAGE_KEY = 'site-use-pointer-cursor'
export const MOTION_STORAGE_KEY = 'site-motion-preference'
export const UI_FONT_SIZE_STORAGE_KEY = 'site-ui-font-size'

export const DEFAULT_UI_FONT_SIZE = 14
export const MIN_UI_FONT_SIZE = 12
export const MAX_UI_FONT_SIZE = 18
export const UI_FONT_SIZE_STEPS = [MIN_UI_FONT_SIZE, DEFAULT_UI_FONT_SIZE, MAX_UI_FONT_SIZE] as const
export const DESKTOP_UI_MEDIA_QUERY = '(min-width: 960px)'

export function normalizeUiFontSize(value: unknown): number {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue))
    return DEFAULT_UI_FONT_SIZE
  const clamped = Math.min(MAX_UI_FONT_SIZE, Math.max(MIN_UI_FONT_SIZE, Math.round(numericValue)))
  return UI_FONT_SIZE_STEPS.reduce((closest, step) =>
    Math.abs(step - clamped) < Math.abs(closest - clamped) ? step : closest,
  )
}

export function resolveReducedMotion(preference: MotionPreference, systemReduced: boolean): boolean {
  if (preference === 'reduce')
    return true
  if (preference === 'no-preference')
    return false
  return systemReduced
}

export function applySitePreferences(
  root: HTMLElement,
  preferences: {
    usePointerCursor: boolean
    reducedMotion: boolean
    uiFontSize: number
    desktop: boolean
  },
): void {
  root.dataset.pointerCursor = String(preferences.usePointerCursor)
  root.dataset.reducedMotion = String(preferences.reducedMotion)

  const effectiveFontSize = preferences.desktop
    ? normalizeUiFontSize(preferences.uiFontSize)
    : DEFAULT_UI_FONT_SIZE
  root.dataset.uiFontSize = String(effectiveFontSize)
  root.style.setProperty('--site-ui-scale', String(effectiveFontSize / DEFAULT_UI_FONT_SIZE))
}

export const sitePreferencesBootScript = `
(() => {
  const root = document.documentElement;
  const read = (key, fallback) => { try { return localStorage.getItem(key) ?? fallback } catch { return fallback } };
  const pointer = read('${POINTER_CURSOR_STORAGE_KEY}', 'false') === 'true';
  const motion = read('${MOTION_STORAGE_KEY}', 'system');
  const systemReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = matchMedia('${DESKTOP_UI_MEDIA_QUERY}').matches;
  const rawSize = Number(read('${UI_FONT_SIZE_STORAGE_KEY}', '${DEFAULT_UI_FONT_SIZE}'));
  const size = desktop && Number.isFinite(rawSize)
    ? [${UI_FONT_SIZE_STEPS.join(',')}].reduce((closest, step) => Math.abs(step - rawSize) < Math.abs(closest - rawSize) ? step : closest)
    : ${DEFAULT_UI_FONT_SIZE};
  root.dataset.pointerCursor = String(pointer);
  root.dataset.reducedMotion = String(motion === 'reduce' || (motion === 'system' && systemReduced));
  root.dataset.uiFontSize = String(size);
  root.style.setProperty('--site-ui-scale', String(size / ${DEFAULT_UI_FONT_SIZE}));
})();`
