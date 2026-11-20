import type { CSSObject, Preflight, PresetUnoTheme, Rule } from 'unocss'

type ScrollFadeEdge = 't' | 'b' | 's' | 'e'

const scrollFadeSize = 'min(12%, calc(var(--spacing) * 10))'
const scrollFadeReveal = 'var(--scroll-fade-reveal, calc(var(--spacing) * 24))'
const scrollFadeEdgeSize = (e: ScrollFadeEdge) => `var(--scroll-fade-${e}-size,var(--scroll-fade-size,${scrollFadeSize}))`
const scrollFadeKeyframes: Record<ScrollFadeEdge, string> = {
  t: `@keyframes scroll-fade-reveal-t{from{--scroll-fade-t:0px}to{--scroll-fade-t:${scrollFadeEdgeSize('t')}}}`,
  b: `@keyframes scroll-fade-reveal-b{from{--scroll-fade-b:${scrollFadeEdgeSize('b')}}to{--scroll-fade-b:0px}}`,
  s: `@keyframes scroll-fade-reveal-s{from{--scroll-fade-s:0px}to{--scroll-fade-s:${scrollFadeEdgeSize('s')}}}`,
  e: `@keyframes scroll-fade-reveal-e{from{--scroll-fade-e:${scrollFadeEdgeSize('e')}}to{--scroll-fade-e:0px}}`,
}

const scrollFadeMaskRepeat = {
  '-webkit-mask-repeat': 'no-repeat',
  'mask-repeat': 'no-repeat',
}

/** 单轴双侧淡出:滚动驱动的双端动画,不支持时退化为静态遮罩。 */
function scrollFadeAxis(sel: string, mask: string, edges: [ScrollFadeEdge, ScrollFadeEdge], timeline: string, rtl?: string): Rule<PresetUnoTheme> {
  const [a, b] = edges
  const css: (CSSObject | string)[] = [
    {
      '-webkit-mask-image': mask,
      'mask-image': mask,
      '-webkit-mask-composite': 'source-in',
      'mask-composite': 'intersect',
      ...scrollFadeMaskRepeat,
    },
  ]
  if (rtl)
    css.push(`.${sel}:where([dir="rtl"],[dir="rtl"] *){-webkit-mask-image:${rtl};mask-image:${rtl}}`)
  css.push(
    `@supports (animation-timeline:scroll()){.${sel}{animation:scroll-fade-reveal-${a} 1ms ease-in-out,scroll-fade-reveal-${b} 1ms ease-in-out;animation-timeline:scroll(self ${timeline}),scroll(self ${timeline});animation-range:0 ${scrollFadeReveal},calc(100% - ${scrollFadeReveal}) 100%;animation-fill-mode:both}}`,
    `@supports not (animation-timeline:scroll()){.${sel}{--scroll-fade-${a}:${scrollFadeEdgeSize(a)};--scroll-fade-${b}:${scrollFadeEdgeSize(b)}}}`,
    scrollFadeKeyframes[a],
    scrollFadeKeyframes[b],
  )
  return [sel, css]
}

/** 单边淡出:只追踪滚动轴的一端。 */
function scrollFadeEdge(sel: string, e: ScrollFadeEdge, mask: string, timeline: string, range: string, rtl?: string): Rule<PresetUnoTheme> {
  const css: (CSSObject | string)[] = [
    {
      '--scroll-fade-mask': mask,
      '-webkit-mask-image': 'var(--scroll-fade-mask)',
      'mask-image': 'var(--scroll-fade-mask)',
      ...scrollFadeMaskRepeat,
    },
  ]
  if (rtl)
    css.push(`.${sel}:where([dir="rtl"],[dir="rtl"] *){--scroll-fade-mask:${rtl}}`)
  css.push(
    `@supports (animation-timeline:scroll()){.${sel}{animation:scroll-fade-reveal-${e} 1ms ease-in-out;animation-timeline:scroll(self ${timeline});animation-range:${range};animation-fill-mode:both}}`,
    `@supports not (animation-timeline:scroll()){.${sel}{--scroll-fade-${e}:${scrollFadeEdgeSize(e)}}}`,
    scrollFadeKeyframes[e],
  )
  return [sel, css]
}

const scrollFadeBlock = 'linear-gradient(to bottom,transparent 0,#000 var(--scroll-fade-t,0px),#000 calc(100% - var(--scroll-fade-b,0px)),transparent 100%)'
const scrollFadeInline = 'linear-gradient(to right,transparent 0,#000 var(--scroll-fade-s,0px),#000 calc(100% - var(--scroll-fade-e,0px)),transparent 100%)'

export const scrollFadeRules: Rule<PresetUnoTheme>[] = [
  scrollFadeAxis('scroll-fade', scrollFadeBlock, ['t', 'b'], 'y'),
  scrollFadeAxis('scroll-fade-y', scrollFadeBlock, ['t', 'b'], 'y'),
  scrollFadeAxis('scroll-fade-x', scrollFadeInline, ['s', 'e'], 'inline', scrollFadeInline.replace('to right', 'to left')),
  scrollFadeEdge('scroll-fade-t', 't', 'linear-gradient(to bottom,transparent 0,#000 var(--scroll-fade-t,0px),#000 100%)', 'y', `0 ${scrollFadeReveal}`),
  scrollFadeEdge('scroll-fade-b', 'b', 'linear-gradient(to bottom,#000 0,#000 calc(100% - var(--scroll-fade-b,0px)),transparent 100%)', 'y', `calc(100% - ${scrollFadeReveal}) 100%`),
  scrollFadeEdge('scroll-fade-l', 's', 'linear-gradient(to right,transparent 0,#000 var(--scroll-fade-s,0px),#000 100%)', 'x', `0 ${scrollFadeReveal}`),
  scrollFadeEdge('scroll-fade-r', 'e', 'linear-gradient(to right,#000 0,#000 calc(100% - var(--scroll-fade-e,0px)),transparent 100%)', 'x', `calc(100% - ${scrollFadeReveal}) 100%`),
  scrollFadeEdge('scroll-fade-s', 's', 'linear-gradient(to right,transparent 0,#000 var(--scroll-fade-s,0px),#000 100%)', 'inline', `0 ${scrollFadeReveal}`, 'linear-gradient(to left,transparent 0,#000 var(--scroll-fade-s,0px),#000 100%)'),
  scrollFadeEdge('scroll-fade-e', 'e', 'linear-gradient(to right,#000 0,#000 calc(100% - var(--scroll-fade-e,0px)),transparent 100%)', 'inline', `calc(100% - ${scrollFadeReveal}) 100%`, 'linear-gradient(to left,#000 0,#000 calc(100% - var(--scroll-fade-e,0px)),transparent 100%)'),
  ['scroll-fade-none', { '--scroll-fade-mask': 'none' }],
  [/^scroll-fade-([tbse])-\[(.+)\]$/, ([, e, v]) => ({ [`--scroll-fade-${e}-size`]: v })],
  [/^scroll-fade-([tbse])-(\d+)$/, ([, e, n]) => ({ [`--scroll-fade-${e}-size`]: `calc(var(--spacing) * ${n})` })],
  [/^scroll-fade-\[(.+)\]$/, ([, v]) => ({ '--scroll-fade-size': v })],
  [/^scroll-fade-(\d+)$/, ([, n]) => ({ '--scroll-fade-size': `calc(var(--spacing) * ${n})` })],
]

export const scrollFadePreflight: Preflight = {
  layer: 'default',
  getCSS: () => `
@property --scroll-fade-t{syntax:"<length-percentage>";inherits:false;initial-value:0px}
@property --scroll-fade-b{syntax:"<length-percentage>";inherits:false;initial-value:0px}
@property --scroll-fade-s{syntax:"<length-percentage>";inherits:false;initial-value:0px}
@property --scroll-fade-e{syntax:"<length-percentage>";inherits:false;initial-value:0px}
@property --scroll-fade-mask{syntax:"*";inherits:false}`,
}
