import type { Preflight } from 'unocss'
import { scrollFadePreflight, scrollFadeRules } from './scroll-fade.ts'
import { shimmerPreflight, shimmerRules } from './shimmer.ts'

export const borderBaselinePreflight: Preflight = {
  layer: 'default',
  getCSS: () => `
*, ::before, ::after {
  border-width: 0;
  border-style: solid;
  border-color: currentColor;
}`,
}

/** shadcn-vue 工具类(shimmer / scroll-fade)的 UnoCSS 规则与 preflight 汇总。 */
export const shadcnRules = [...shimmerRules, ...scrollFadeRules]

export const shadcnPreflights = [borderBaselinePreflight, shimmerPreflight, scrollFadePreflight]
