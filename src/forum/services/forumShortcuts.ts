export const FORUM_SHORTCUTS = [
  { id: 'send', group: 'input', binding: 'Mod+Enter' },
  { id: 'bold', group: 'input', binding: 'Mod+B' },
  { id: 'italic', group: 'input', binding: 'Mod+I' },
  { id: 'strike', group: 'input', binding: 'Mod+Shift+X' },
  { id: 'search', group: 'application', binding: '/' },
  { id: 'publish', group: 'application', binding: '' },
  { id: 'settings', group: 'application', binding: '' },
] as const

export type ForumShortcutId = typeof FORUM_SHORTCUTS[number]['id']
export type ForumInputShortcutId = Extract<ForumShortcutId, 'send' | 'bold' | 'italic' | 'strike'>
export type ForumShortcutGroup = typeof FORUM_SHORTCUTS[number]['group']
export interface ShortcutOverride { enabled: boolean, binding: string }
export interface ShortcutPreferences {
  overrides: Partial<Record<ForumShortcutId, ShortcutOverride>>
}

const MODIFIERS = ['Mod', 'Ctrl', 'Alt', 'Shift', 'Meta'] as const
const RESERVED_PRIMARY_KEYS = /^[ACFLNPRTVWXZ]$/
const KEYS = /^(?:[A-Z0-9/.,;[\]'`=\\-]|Enter|Space|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Plus)$/

export function normalizeShortcut(value: unknown): string | null {
  if (value === '')
    return ''
  if (typeof value !== 'string')
    return null
  const parts = value.split('+')
  const key = parts.pop()!
  if (!KEYS.test(key) || parts.some(part => !MODIFIERS.includes(part as typeof MODIFIERS[number]))
    || new Set(parts).size !== parts.length || (parts.includes('Mod') && (parts.includes('Ctrl') || parts.includes('Meta')))) {
    return null
  }
  return [...MODIFIERS.filter(modifier => parts.includes(modifier)), key].join('+')
}

export function normalizeShortcutPreferences(value: unknown): ShortcutPreferences {
  const result: ShortcutPreferences = { overrides: {} }
  if (!value || typeof value !== 'object')
    return result
  const stored = value as Partial<ShortcutPreferences>
  for (const { id } of FORUM_SHORTCUTS) {
    const override = stored.overrides?.[id]
    const binding = normalizeShortcut(override?.binding)
    if (override && binding !== null)
      result.overrides[id] = { enabled: override.enabled !== false, binding }
  }
  return result
}

export function resolveShortcut(preferences: ShortcutPreferences, id: ForumShortcutId): ShortcutOverride {
  return preferences.overrides[id] ?? { enabled: true, binding: FORUM_SHORTCUTS.find(action => action.id === id)!.binding }
}

interface KeyStroke {
  key: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

function eventKey(key: string): string {
  return key === ' ' ? 'Space' : key === '+' ? 'Plus' : key.length === 1 ? key.toUpperCase() : key
}

export function matchesShortcut(binding: string, event: KeyStroke): boolean {
  if (!binding)
    return false
  const parts = binding.split('+')
  if (parts.pop() !== eventKey(event.key))
    return false
  const primary = parts.includes('Mod')
  return (primary ? event.ctrlKey !== event.metaKey : event.ctrlKey === parts.includes('Ctrl') && event.metaKey === parts.includes('Meta'))
    && event.altKey === parts.includes('Alt') && event.shiftKey === parts.includes('Shift')
}

/** A disabled or remapped binding is still consumed so editor defaults cannot take over. */
export function resolveEditorShortcut(preferences: ShortcutPreferences, event: KeyStroke, canSend: boolean): { id: ForumInputShortcutId, enabled: boolean } | null {
  let disabledMatch: ForumInputShortcutId | undefined
  for (const action of FORUM_SHORTCUTS) {
    if (action.group !== 'input' || (action.id === 'send' && !canSend))
      continue
    const state = resolveShortcut(preferences, action.id)
    if (matchesShortcut(state.binding, event)) {
      if (state.enabled)
        return { id: action.id, enabled: true }
      disabledMatch ??= action.id
    }
  }
  if (disabledMatch)
    return { id: disabledMatch, enabled: false }
  for (const action of FORUM_SHORTCUTS) {
    if (action.group === 'input' && action.id !== 'send' && matchesShortcut(action.binding, event))
      return { id: action.id, enabled: false }
  }
  return null
}

export function shortcutFromEvent(event: KeyStroke, mac: boolean): string | null {
  const key = eventKey(event.key)
  if (!KEYS.test(key))
    return null
  const primary = mac ? event.metaKey : event.ctrlKey
  const modifiers = [
    primary ? 'Mod' : '',
    event.ctrlKey && (!primary || mac) ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.metaKey && (!primary || !mac) ? 'Meta' : '',
  ].filter(Boolean)
  return normalizeShortcut([...modifiers, key].join('+'))
}

function bindingsOverlap(left: string, right: string): boolean {
  const expand = (binding: string) => binding.includes('Mod')
    ? ['Ctrl', 'Meta'].map(modifier => normalizeShortcut(binding.replace('Mod', modifier)))
    : [normalizeShortcut(binding)]
  return expand(left).some(binding => expand(right).includes(binding))
}

export function shortcutBindingError(id: ForumShortcutId, binding: string, preferences: ShortcutPreferences): 'invalid' | 'reserved' | ForumShortcutId | null {
  if (normalizeShortcut(binding) === null)
    return 'invalid'
  if (!binding)
    return null
  const action = FORUM_SHORTCUTS.find(action => action.id === id)!
  const parts = binding.split('+')
  const key = parts.at(-1)!
  const hasPrimary = parts.some(part => ['Mod', 'Ctrl', 'Meta'].includes(part))
  // Text editing and browser navigation shortcuts must stay available.
  if ((hasPrimary && parts.length === 2 && RESERVED_PRIMARY_KEYS.test(key))
    || (parts.includes('Alt') && !hasPrimary)
    || (parts.length === 1 && !(id === 'search' && key === '/'))) {
    return 'reserved'
  }
  for (const other of FORUM_SHORTCUTS) {
    if (other.id === id || (other.group === 'input') !== (action.group === 'input'))
      continue
    const resolved = resolveShortcut(preferences, other.id)
    if (resolved.enabled && resolved.binding && bindingsOverlap(binding, resolved.binding))
      return other.id
  }
  return null
}
