import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  shortcuts: [
    [
      'icon-btn',
      'inline-block cursor-pointer select-none opacity-75 scale-155 transition duration-200 ease-in-out hover:opacity-100 hover:text-teal-600',
    ],
    ['card-grid', 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8'],
  ],
  presets: [
    presetUno(),
    presetAttributify(),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'DM Sans',
        serif: 'DM Serif Display',
        mono: 'DM Mono',
      },
    }),
    presetIcons({
      scale: 1.2,
      warn: true,
      collections: {
        custom: getCustomIcons(),
      },
    }),
  ],
  theme: {
    colors: {
      primary: 'var(--vp-c-brand)',
    },
  },
  transformers: [transformerDirectives(), transformerVariantGroup()],
  safelist: 'prose prose-sm m-auto text-left'.split(' '),
})

function getCustomIcons() {
  const data = {}

  fs.readdirSync(path.resolve(__dirname, './src/public/svg')).forEach((val) => {
    // @ts-ignore
    data[val.replace('.svg', '')] = fs.readFileSync(
      path.resolve(__dirname, './src/public/svg/' + val),
      'utf8',
    )
  })

  return data
}
