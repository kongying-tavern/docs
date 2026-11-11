export type ShortcutPlatform = 'mac' | 'windows' | 'linux' | 'unknown'
export type ShortcutPlatformPreference = Exclude<ShortcutPlatform, 'unknown'> | 'auto'

interface NavigatorPlatform {
  platform?: string
  userAgent?: string
  userAgentData?: { platform?: string }
}

export function detectShortcutPlatform(navigator: NavigatorPlatform): ShortcutPlatform {
  const platform = navigator.userAgentData?.platform || navigator.platform || navigator.userAgent || ''
  if (/Mac|iPhone|iPad|iPod/i.test(platform))
    return 'mac'
  if (/Win/i.test(platform))
    return 'windows'
  if (/Linux|Android|CrOS/i.test(platform))
    return 'linux'
  return 'unknown'
}

const aliases: Record<string, string> = {
  'mod': 'Mod',
  'ctrl': 'Control',
  'control': 'Control',
  '⌃': 'Control',
  'cmd': 'Command',
  'command': 'Command',
  '⌘': 'Command',
  'alt': 'Alt',
  'opt': 'Option',
  'option': 'Option',
  '⌥': 'Option',
  'shift': 'Shift',
  '⇧': 'Shift',
  'meta': 'Meta',
  'win': 'Win',
  'windows': 'Win',
  '⊞': 'Win',
  'super': 'Super',
  'up': 'ArrowUp',
  'arrowup': 'ArrowUp',
  'arrup': 'ArrowUp',
  '↑': 'ArrowUp',
  'down': 'ArrowDown',
  'arrowdown': 'ArrowDown',
  'arrdown': 'ArrowDown',
  '↓': 'ArrowDown',
  'left': 'ArrowLeft',
  'arrowleft': 'ArrowLeft',
  'arrleft': 'ArrowLeft',
  '←': 'ArrowLeft',
  'right': 'ArrowRight',
  'arrowright': 'ArrowRight',
  'arrright': 'ArrowRight',
  '→': 'ArrowRight',
  'esc': 'Escape',
  'escape': 'Escape',
  'enter': 'Enter',
  'ret': 'Enter',
  'return': 'Enter',
  '⏎': 'Enter',
  '↵': 'Enter',
  'tab': 'Tab',
  '⇥': 'Tab',
  'space': 'Space',
  'spacebar': 'Space',
  '␣': 'Space',
  'backspace': 'Backspace',
  '⌫': 'Backspace',
  'del': 'Delete',
  'delete': 'Delete',
  '⌦': 'Delete',
  'capslock': 'CapsLock',
  '⇪': 'CapsLock',
  'pageup': 'PageUp',
  'pgup': 'PageUp',
  '⇞': 'PageUp',
  'pagedown': 'PageDown',
  'pgdn': 'PageDown',
  '⇟': 'PageDown',
  'home': 'Home',
  'end': 'End',
  'ins': 'Insert',
  'insert': 'Insert',
  'plus': '+',
  'comma': ',',
  'minus': '-',
  'period': '.',
  'slash': '/',
  'backslash': '\\',
  'bracketleft': '[',
  'bracketright': ']',
}

const symbols: Record<string, string> = {
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Command: '⌘',
  Option: '⌥',
  Win: '⊞',
  Escape: 'Esc',
}

const macSymbols: Record<string, string> = {
  Control: '⌃',
  Alt: '⌥',
  Shift: '⇧',
  Enter: '⏎',
  Tab: '⇥',
  Backspace: '⌫',
  Delete: '⌦',
  CapsLock: '⇪',
  PageUp: '⇞',
  PageDown: '⇟',
}

const names: Record<string, string> = {
  'ArrowUp': 'Arrow Up',
  'ArrowDown': 'Arrow Down',
  'ArrowLeft': 'Arrow Left',
  'ArrowRight': 'Arrow Right',
  'Win': 'Windows',
  'CapsLock': 'Caps Lock',
  'PageUp': 'Page Up',
  'PageDown': 'Page Down',
  '+': 'Plus',
  ',': 'Comma',
  '-': 'Minus',
  '.': 'Period',
  '/': 'Slash',
  '\\': 'Backslash',
  '[': 'Left Bracket',
  ']': 'Right Bracket',
}

function lookup(map: Record<string, string>, key: string): string | undefined {
  return Object.hasOwn(map, key) ? map[key] : undefined
}

/** Resolve presentation only; an explicit Control key never becomes Command. */
export function resolveShortcutKey(value: string, platform: ShortcutPlatform): { label: string, name: string } {
  const trimmed = value.trim()
  let key = lookup(aliases, trimmed.toLowerCase()) ?? trimmed
  if (/^[a-z]$/i.test(key) || /^f\d{1,2}$/i.test(key))
    key = key.toUpperCase()
  if (key === 'Mod') {
    if (platform === 'unknown')
      return { label: 'Ctrl / ⌘', name: 'Control / Command' }
    key = platform === 'mac' ? 'Command' : 'Control'
  }
  if (key === 'Meta' && platform === 'mac')
    key = 'Command'
  else if (key === 'Meta' && platform === 'windows')
    key = 'Win'
  const label = (platform === 'mac' ? lookup(macSymbols, key) : undefined)
    ?? lookup(symbols, key)
    ?? (key === 'Control' ? 'Ctrl' : key)
  return { label, name: lookup(names, key) ?? key }
}
