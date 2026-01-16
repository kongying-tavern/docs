import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetWind4,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import presetAnimations from 'unocss-preset-animations'
import { presetShadcn } from 'unocss-preset-shadcn'
import { resolveCustomIcons } from './scripts/resolveCustomIcons.ts'

export default defineConfig({
  rules: [
    [
      'custom-scrollbar',
      {
        'scrollbar-width': 'thin',
        'scrollbar-color': 'hsl(var(--muted-foreground) / 0.2) transparent',
      },
    ],
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
      'before:content-[attr(data-valuelength)/attr(data-maxlength)] before:absolute before:left-0 before:bottom--0 before:c-[var(--vp-c-text-3)] before:font-size-[12px]',
    ],
    // Doc reaction feedback states
    [
      'doc-reaction-feedback-state-base',
      'inline-block fill-current flex-basis-20px flex-shrink-0 font-size-18px mr-2',
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
      `[&::-webkit-scrollbar]:w-4px
       [&::-webkit-scrollbar-track]:bg-transparent
       [&::-webkit-scrollbar-thumb]:bg-[hsl(var(--muted-foreground)/0.2)]
       [&::-webkit-scrollbar-thumb]:rounded-2px
       [&::-webkit-scrollbar-thumb:hover]:bg-[hsl(var(--muted-foreground)/0.4)]
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
