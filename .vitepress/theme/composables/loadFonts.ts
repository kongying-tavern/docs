import { withBase } from 'vitepress'

const FONT_LOAD_COMPLETE_CLASS = 'font-loaded'

interface FontItem {
  fontName: string
  fontPath: string
}

export function loadFonts(options: FontItem[]) {
  if (import.meta.env.SSR)
    return null
  if (!('fonts' in document))
    return null

  const loadFont = (fontName: string, fontPath: string): Promise<void> => {
    const font = new FontFace(fontName, `url(${withBase(fontPath)})`, {
      display: 'swap',
    })

    return font
      .load()
      .then(() => {
        document.fonts.add(font)
      })
      .catch(() => {
        // Font load error - silent fail
      })
  }

  Promise.all(options.map(font => loadFont(font.fontName, font.fontPath)))
    .then(() => {
      document.documentElement.classList.add(FONT_LOAD_COMPLETE_CLASS)
    })
    .catch(() => {
      // Font load error - silent fail
    })
}
