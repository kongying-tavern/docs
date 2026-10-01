import type { PresetUnoTheme, Rule } from 'unocss'

export const switchRules: Rule<PresetUnoTheme>[] = [
  [
    'switch-thumb-motion',
    {
      transition: 'translate 300ms cubic-bezier(0.25, 1, 0.4, 1), scale 150ms ease-out',
    },
  ],
  [
    'switch-thumb-pulse',
    [
      { animation: 'switch-thumb-pulse 340ms' },
      `@keyframes switch-thumb-pulse{0%{scale:1 1;animation-timing-function:ease-out}40%{scale:1.16 1;animation-timing-function:ease-in-out}100%{scale:1 1}}`,
    ],
  ],
]
