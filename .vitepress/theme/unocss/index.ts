import type { Preflight } from 'unocss'
import { scrollFadePreflight, scrollFadeRules } from './scroll-fade.ts'
import { shimmerPreflight, shimmerRules } from './shimmer.ts'
import { switchRules } from './switch.ts'

export const borderBaselinePreflight: Preflight = {
  layer: 'default',
  getCSS: () => `
*, ::before, ::after {
  border-width: 0;
  border-style: solid;
  /* 主题变量是 oklch 分量（--border: L C H），而 Wind4 会把 oklch(var(--x)) 折叠成
     var(--x)（假定变量已是完整颜色），导致非法值回落 currentColor。因此这里引用
     theme.css 提供的完整色形式 --border-color，而非 oklch(var(--border)) */
  border-color: var(--border-color);
}`,
}

/** shadcn-vue 工具类(shimmer / scroll-fade / switch)的 UnoCSS 规则与 preflight 汇总。 */
export const shadcnRules = [...shimmerRules, ...scrollFadeRules, ...switchRules]

export const shadcnPreflights = [borderBaselinePreflight, shimmerPreflight, scrollFadePreflight]
