import type { Preflight } from 'unocss'
import { scrollFadePreflight, scrollFadeRules } from './scroll-fade.ts'
import { shimmerPreflight, shimmerRules } from './shimmer.ts'

export const borderBaselinePreflight: Preflight = {
  layer: 'default',
  getCSS: () => `
*, ::before, ::after {
  border-width: 0;
  border-style: solid;
  /* 主题变量为 oklch 分量（--border: L C H），必须以 oklch() 包装才是合法颜色；
     缺色时 border-color 会回落 currentColor，弹层边框就会跟随文字色变成深色实线 */
  border-color: oklch(var(--border));
}`,
}

/** shadcn-vue 工具类(shimmer / scroll-fade)的 UnoCSS 规则与 preflight 汇总。 */
export const shadcnRules = [...shimmerRules, ...scrollFadeRules]

export const shadcnPreflights = [borderBaselinePreflight, shimmerPreflight, scrollFadePreflight]
