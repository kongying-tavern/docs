import type { Preset } from 'unocss'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWind3,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'
import { resolveCustomIcons } from './scripts/resolveCustomIcons.ts'

export default defineConfig({
  shortcuts: [
    [
      'icon-btn',
      'inline-block align-mid w-5 h-5 flex-shrink-0 cursor-pointer select-none transition duration-200 ease-in-out',
    ],
    ['card-grid', 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8'],
    [
      'vp-divider',
      'border-b-[var(--vp-c-gutter)] border-b-1px box-border w-full',
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
      'before:content-[attr(data-valuelength)/attr(data-maxlength)] before:absolute before:left-0 before:bottom--0 before:c-[var(--vp-c-text-3)] before:font-size-[12px]',
    ],
  ],
  presets: [
    presetWind3({
      container: false,
    }),
    presetAttributify(),
    presetTypography(),
    presetAnimations() as Preset<object>,
    presetShadcn(),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        custom: resolveCustomIcons(),
      },
    }),
  ],
  theme: {
    container: {
      center: true,
      padding: false,
      screens: {
        '2xl': '1440px',
      },
    },
    colors: {
      border: 'var(--vp-c-border)',
      input: 'var(--vp-c-gutter)',
      ring: 'var(--vp-c-divider)',
      background: 'var(--vp-c-bg)',
      foreground: 'var(--vp-c-text-1)',
      primary: {
        DEFAULT: 'hsl(153.22, 47.83, 50.39)',
        foreground: 'var(--vp-c-white)',
      },
      secondary: {
        DEFAULT: 'var(--vp-button-alt-bg)',
        foreground: 'var(--vp-button-alt-text)',
      },
      destructive: {
        DEFAULT: 'hsl(var(--destructive))',
        foreground: 'hsl(var(--destructive-foreground))',
      },
      muted: {
        DEFAULT: 'hsl(var(--muted))',
        foreground: 'hsl(var(--muted-foreground))',
      },
      accent: {
        DEFAULT: 'hsl(var(--accent))',
        foreground: 'hsl(var(--accent-foreground))',
      },
      popover: {
        DEFAULT: 'var(--vp-c-bg-elv)',
        foreground: 'var(--vp-c-text-1)',
      },
      card: {
        DEFAULT: 'var(--vp-c-bg-soft)',
        foreground: 'var(--vp-c-text-2)',
      },
    },
    borderRadius: {
      xl: 'calc(var(--radius) + 4px)',
      lg: 'var(--radius)',
      md: 'calc(var(--radius) - 2px)',
      sm: 'calc(var(--radius) - 4px)',
    },
    keyframes: {
      'accordion-down': {
        from: { height: 0 },
        to: { height: 'var(--radix-accordion-content-height)' },
      },
      'accordion-up': {
        from: { height: 'var(--radix-accordion-content-height)' },
        to: { height: 0 },
      },
      'collapsible-down': {
        from: { height: 0 },
        to: { height: 'var(--radix-collapsible-content-height)' },
      },
      'collapsible-up': {
        from: { height: 'var(--radix-collapsible-content-height)' },
        to: { height: 0 },
      },
    },
    animation: {
      'accordion-down': 'accordion-down 0.2s ease-out',
      'accordion-up': 'accordion-up 0.2s ease-out',
      'collapsible-down': 'collapsible-down 0.2s ease-in-out',
      'collapsible-up': 'collapsible-up 0.2s ease-in-out',
    },
  },
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        'src/**/*.{js,ts}',
      ],
    },
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: 'prose prose-sm m-auto text-left'.split(' '),
})
