import type { Preflight, PresetUnoTheme, Rule } from 'unocss'

const shimmerAlphaSuffixRE = /^\/(\d+)$/

function findThemeColor(theme: PresetUnoTheme, name: string): string | undefined {
  const colors = theme.colors as Record<string, unknown> | undefined
  if (!colors)
    return

  const flat = colors[name]
  if (typeof flat === 'string')
    return flat
  if (flat && typeof flat === 'object') {
    const fallback = (flat as Record<string, unknown>).DEFAULT
    if (typeof fallback === 'string')
      return fallback
  }

  let node: unknown = colors
  for (const part of name.split('-')) {
    if (!node || typeof node !== 'object')
      return
    node = (node as Record<string, unknown>)[part]
  }
  if (typeof node === 'string')
    return node
  if (node && typeof node === 'object') {
    const fallback = (node as Record<string, unknown>).DEFAULT
    if (typeof fallback === 'string')
      return fallback
  }
}

function resolveShimmerColor(body: string, theme: PresetUnoTheme): string {
  let value: string
  let pct: string | undefined
  if (body.startsWith('[')) {
    const end = body.indexOf(']')
    value = body.slice(1, end)
    pct = body.slice(end + 1).match(shimmerAlphaSuffixRE)?.[1]
  }
  else {
    const slash = body.indexOf('/')
    if (slash >= 0) {
      value = body.slice(0, slash)
      pct = body.slice(slash + 1)
    }
    else {
      value = body
    }
  }
  const color = findThemeColor(theme, value) ?? value
  return pct
    ? `color-mix(in oklch, ${color} ${pct}%, transparent)`
    : color
}

const SHIMMER_GRADIENT = `linear-gradient(calc(90deg + var(--shimmer-angle)),var(--_base) calc(50% - var(--_spread)),color-mix(in oklch,var(--_highlight),var(--_base) 50%) calc(50% - var(--_spread) * 0.5),var(--_highlight) 50%,color-mix(in oklch,var(--_highlight),var(--_base) 50%) calc(50% + var(--_spread) * 0.5),var(--_base) calc(50% + var(--_spread)))`

export const shimmerRules: Rule<PresetUnoTheme>[] = [
  [
    'shimmer',
    [
      {
        '--_spread': 'var(--shimmer-spread, calc(3ch + 40px))',
        '--_base': 'currentColor',
        '--_highlight': 'var(--shimmer-color, oklch(from currentColor l c h / calc(alpha * 0.2)))',
        'background-image': `var(--shimmer-image, ${SHIMMER_GRADIENT})`,
        'background-repeat': 'no-repeat',
        'background-size': 'calc(200% + var(--_spread) * 2) 100%',
        'background-position': '0 0',
        'background-clip': 'text',
        '-webkit-background-clip': 'text',
        '-webkit-text-fill-color': 'var(--shimmer-text-fill, transparent)',
        'animation': 'tw-shimmer var(--shimmer-duration, 2s) linear infinite',
      },
      '@keyframes tw-shimmer{from{background-position:100% 0}to{background-position:0 0}}',
      ':where(html.dark) .shimmer{--_highlight:var(--shimmer-color,oklch(from currentColor max(0.8,calc(l + 0.4)) c h / calc(alpha + 0.4)))}',
      '.shimmer:where([dir="rtl"],[dir="rtl"] *){animation-direction:reverse}',
      '@media (prefers-reduced-motion:reduce){.shimmer{animation:none;background-image:none;-webkit-text-fill-color:currentColor}}',
    ],
  ],
  ['shimmer-once', { 'animation-iteration-count': '1' }],
  ['shimmer-reverse', { 'animation-direction': 'reverse' }],
  ['shimmer-none', { '--shimmer-image': 'none', '--shimmer-text-fill': 'currentColor' }],
  [/^shimmer-duration-(\d+)$/, ([, n]) => ({ '--shimmer-duration': `calc(${n} * 1ms)` })],
  [/^shimmer-angle-(\d+)$/, ([, n]) => ({ '--shimmer-angle': `calc(${n} * 1deg)` })],
  [/^shimmer-spread-\[(.+)\]$/, ([, v]) => ({ '--shimmer-spread': v })],
  [/^shimmer-spread-(\d+)$/, ([, n]) => ({ '--shimmer-spread': `calc(var(--spacing) * ${n})` })],
  [
    /^shimmer-color-(.+)$/,
    ([, color], { theme }) => ({ '--shimmer-color': resolveShimmerColor(color, theme) }),
  ],
]

export const shimmerPreflight: Preflight = {
  layer: 'default',
  getCSS: () => `
@property --shimmer-angle{syntax:"<angle>";inherits:true;initial-value:20deg}
@property --shimmer-image{syntax:"*";inherits:false}
@property --shimmer-text-fill{syntax:"*";inherits:false}`,
}
