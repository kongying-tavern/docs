import { withBase } from 'vitepress'

// const FONT_LOAD_STATE_STORE_KEY = 'FONTS_LOAD_STATE'
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

  // const fontsLoadState = useSessionStorage<string[]>(FONT_LOAD_STATE_STORE_KEY, [])

  // const hasLoad = (family: string) => fontsLoadState.value.includes(family)

  const loadFont = (fontName: string, fontPath: string): Promise<void> => {
    // if (hasLoad(fontName)) return Promise.resolve()

    const font = new FontFace(fontName, `url(${withBase(fontPath)})`, {
      display: 'swap',
    })

    return font
      .load()
      .then(() => {
        document.fonts.add(font)
        // fontsLoadState.value = [...fontsLoadState.value, fontName]
      })
      .catch((error) => {
        console.error(`Font load error (${fontName}):`, error)
      })
  }

  Promise.all(options.map(font => loadFont(font.fontName, font.fontPath)))
    .then(() => {
      document.documentElement.classList.add(FONT_LOAD_COMPLETE_CLASS)
    })
    .catch((error) => {
      console.error(`Font load error:`, error)
    })
}
