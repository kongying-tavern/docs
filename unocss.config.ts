import type { Variant } from 'unocss'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'
import { shadcnPreflights, shadcnRules } from './.vitepress/theme/unocss/index.ts'
import { resolveCustomIcons } from './scripts/resolveCustomIcons.ts'
import { FORUM_MOBILE_BREAKPOINT_PX } from './src/forum/services/forumConfig'

const scaledUiSize = (size: number) => `calc(${size}px * var(--site-ui-scale))`
const uiFontSizes = [6, 7, 8, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 30, 32, 36, 40, 42]
const uiLineHeights = [14, 16, 18, 19, 20, 21, 22, 24, 26, 28, 30, 32, 34, 36, 40]

const uiTextTheme = {
  'xs': { fontSize: scaledUiSize(12), lineHeight: scaledUiSize(16) },
  'caption': { fontSize: scaledUiSize(12), lineHeight: scaledUiSize(18) },
  'label': { fontSize: scaledUiSize(13), lineHeight: scaledUiSize(20) },
  'sm': { fontSize: scaledUiSize(14), lineHeight: scaledUiSize(20) },
  'base': { fontSize: scaledUiSize(16), lineHeight: scaledUiSize(24) },
  'lg': { fontSize: scaledUiSize(18), lineHeight: scaledUiSize(28) },
  'xl': { fontSize: scaledUiSize(20), lineHeight: scaledUiSize(28) },
  '2xl': { fontSize: scaledUiSize(24), lineHeight: scaledUiSize(32) },
  '3xl': { fontSize: scaledUiSize(30), lineHeight: scaledUiSize(36) },
  '4xl': { fontSize: scaledUiSize(36), lineHeight: scaledUiSize(40) },
  ...Object.fromEntries(uiFontSizes.map(size => [`ui-${size}`, { fontSize: scaledUiSize(size) }])),
}

export default defineConfig({
  blocklist: [
    /^i-lucide-(?:log-in|x)-.+$/,
  ],
  theme: {
    font: {
      sans: 'var(--vp-font-family-base)',
      serif: 'var(--vp-font-family-serif)',
      mono: 'var(--vp-font-family-mono)',
      title: 'var(--vp-font-family-title)',
      subtitle: 'var(--vp-font-family-subtitle)',
    },
    breakpoint: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'mobile': `${FORUM_MOBILE_BREAKPOINT_PX + 1}px`,
    },
    text: uiTextTheme,
    leading: Object.fromEntries(uiLineHeights.map(size => [`ui-${size}`, scaledUiSize(size)])),
  },
  variants: [
    {
      name: 'site-max-mobile',
      order: -1,
      match: (matcher) => {
        if (!matcher.startsWith('max-mobile:'))
          return matcher
        return {
          matcher: matcher.slice('max-mobile:'.length),
          parent: `@media (max-width: ${FORUM_MOBILE_BREAKPOINT_PX}px)`,
        }
      },
    } as Variant,
    ((matcher) => {
      if (!matcher.startsWith('pointer-fine:'))
        return matcher
      return {
        matcher: matcher.slice('pointer-fine:'.length),
        parent: '@media (hover: hover) and (pointer: fine)',
      }
    }) as Variant,
  ],
  preflights: [...shadcnPreflights],
  rules: [
    ...shadcnRules,
  ],
  shortcuts: [
    [
      'icon-btn',
      'inline-block align-mid w-5 h-5 flex-shrink-0 cursor-pointer select-none transition duration-200 ease-in-out',
    ],
    ['card-grid', 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8'],
    [
      'vp-divider',
      'border-b-[var(--vp-c-gutter)] border-solid border-b-1px box-border w-full',
    ],
    [
      'vp-link',
      'color-[var(--vp-button-brand-bg)] hover:color-[var(--vp-button-brand-hover-bg)] cursor-pointer transition-color',
    ],
    [
      'vp-border-input',
      'border-color-[var(--vp-c-border)] border border-solid important:shadow-none important:hover:shadow-none',
    ],
    [
      'vp-border-divider',
      'border-color-[var(--vp-c-gutter)] border-b border-b-solid',
    ],
    [
      'required',
      'before:content-["*"] before:color-[#e63e3c] before:inline-block before:mr-1 before:font-size-3.5 before:lh-[1]',
    ],
    [
      'vp-button',
      'bg-[var(--vp-button-brand-bg)] c-[var(--vp-button-brand-text)] border-color-[var(--vp-button-brand-border)] hover:bg-[var(--vp-button-brand-hover-bg)] hover:c-[var(--vp-button-brand-hover-text)] hover:border-color-[var(--vp-button-brand-hover-border)] color-[var(--vp-c-white)]',
    ],
    [
      'clear-bg',
      'bg-transparent shadow-none hover:bg-transparent hover:shadow-none',
    ],
    [
      'char-count',
      'before:content-[attr(data-valuelength)/attr(data-maxlength)] before:absolute before:left-0 before:bottom--0 before:c-[var(--vp-c-text-3)] before:text-ui-12',
    ],
    // Doc reaction feedback states
    [
      'doc-reaction-feedback-state-base',
      'inline-block fill-current flex-basis-20px flex-shrink-0 text-ui-18 mr-2 align-text-top',
    ],
    [
      'doc-reaction-feedback-state-success',
      'doc-reaction-feedback-state-base text-color-[var(--vp-c-green-2)] i-custom-badge-check w-5 h-5',
    ],
    [
      'doc-reaction-feedback-state-error',
      'doc-reaction-feedback-state-base text-color-[var(--vp-c-red-2)] i-custom-badge-x w-5 h-5',
    ],
    [
      'custom-scrollbar',
      `[scrollbar-width:thin]
       [scrollbar-color:oklch(var(--muted-foreground)/0.2)_transparent]
       [&::-webkit-scrollbar]:w-4px
       [&::-webkit-scrollbar]:h-4px
       [&::-webkit-scrollbar-track]:bg-transparent
       [&::-webkit-scrollbar-thumb]:bg-[oklch(var(--muted-foreground)/0.2)]
       [&::-webkit-scrollbar-thumb]:rounded-2px
       [&::-webkit-scrollbar-thumb:hover]:bg-[oklch(var(--muted-foreground)/0.4)]
      `,
    ],
  ],
  presets: [
    presetWind4({
      container: false,
      preflights: {
        reset: false,
      },
    }),
    presetTypography({
      sizeScheme: {
        sm: {
          'font-size': scaledUiSize(14),
        },
        base: {
          'font-size': scaledUiSize(16),
        },
      },
    }),
    presetAttributify(),
    presetAnimations(),
    presetShadcn(
      {
        color: false,
        darkSelector: '.dark',
      },
      {
        componentLibrary: 'reka',
      },
    ),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        custom: resolveCustomIcons(),
      },
    }),
  ],
  content: {
    pipeline: {
      include: [
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        /\/src\/[^?]*\.(js|ts)$/,
        /\/\.vitepress\/theme\/[^?]*\.(js|ts)$/,
      ],
      exclude: [/node_modules\//],
    },
  },
  transformers: [transformerDirectives({ enforce: 'pre' }), transformerVariantGroup()],
  // 动态拼接的图标类名无法被提取器扫描,显式声明
  safelist: [
    ...uiFontSizes.map(size => `text-ui-${size}`),
    ...uiLineHeights.map(size => `leading-ui-${size}`),
    'prose',
    'prose-sm',
    'm-auto',
    'text-left',
    // Coins.vue 支付方式图标(`i-custom-${key}` 动态类)
    'i-custom-qqpay',
    'i-custom-wechatpay',
    'i-custom-bilibili',
    'i-custom-alipay',
    'i-custom-paypal',
    // Card.vue 外链域名图标(iconMap 动态类)
    'i-logos-youtube-icon',
    'i-logos-twitter',
    'i-logos-discord-icon',
    'i-logos-reddit-icon',
    // ForumSidebarAccountMenu.vue 的动态图标类
    'i-simple-icons-qq',
    'i-simple-icons-discord',
  ],
})
