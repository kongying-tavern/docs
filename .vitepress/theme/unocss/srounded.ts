import type { Rule } from 'unocss'

const corners: Record<string, string[]> = {
  t: ['top-left', 'top-right'],
  b: ['bottom-left', 'bottom-right'],
  l: ['top-left', 'bottom-left'],
  r: ['top-right', 'bottom-right'],
  tl: ['top-left'],
  tr: ['top-right'],
  bl: ['bottom-left'],
  br: ['bottom-right'],
  s: ['start-start', 'end-start'],
  e: ['start-end', 'end-end'],
  ss: ['start-start'],
  se: ['start-end'],
  es: ['end-start'],
  ee: ['end-end'],
}
const radii: Record<string, string> = {
  'xs': 'calc(var(--radius) - 6px)',
  'sm': 'calc(var(--radius) - 4px)',
  'md': 'calc(var(--radius) - 2px)',
  'lg': 'var(--radius)',
  'xl': 'calc(var(--radius) + 4px)',
  '2xl': 'calc(var(--radius) + 8px)',
  '3xl': 'calc(var(--radius) + 12px)',
  '4xl': 'calc(var(--radius) + 16px)',
}

/**
 * Opt-in smooth corners: srounded-lg, srounded-t-[16px], srounded-ss-sm.
 * --srounded-n / --srounded-scale tune shape and optical radius (both default to 1.6).
 * Unsupported browsers keep ordinary rounding; full stays a conventional pill/circle.
 */
export const sroundedRules: Rule[] = [
  [/^srounded(?:-([tblrse]|tl|tr|bl|br|ss|se|es|ee))?(?:-(none|full|xs|sm|md|lg|xl|2xl|3xl|4xl|\d+(?:\.\d+)?|\[.+\]))?$/, function* ([, side, size], { symbols }) {
    const radius = !size
      ? 'var(--radius)'
      : size === 'none'
        ? '0'
        : size === 'full'
          ? '9999px'
          : radii[size] ?? (size.startsWith('[') ? size.slice(1, -1).replaceAll('_', ' ') : `${Number(size) / 4}rem`)
    const selected = side ? corners[side] : ['']
    const radiusProperties = selected.map(corner => corner ? `border-${corner}-radius` : 'border-radius')
    yield Object.fromEntries(radiusProperties.map(property => [property, radius]))
    yield {
      [symbols.parent]: '@supports (corner-shape: superellipse(1))',
      ...Object.fromEntries(selected.map(corner => [corner ? `corner-${corner}-shape` : 'corner-shape', size === 'none' || size === 'full' ? 'round' : 'superellipse(var(--srounded-n, 1.6))'])),
      ...Object.fromEntries(radiusProperties.map(property => [property, size === 'none' || size === 'full' ? radius : `calc(${radius} * var(--srounded-scale, 1.6))`])),
    }
  }],
]
