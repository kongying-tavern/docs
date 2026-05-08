import type MarkdownIt from 'markdown-it'

/** Matches CSS color values */
const COLOR_REGEX
  = /(?:\s|^)(#(?:[a-fA-F0-9]{3}){1,2}|(?:#(?:[a-fA-F0-9]{4}){1,2})?\b|rgba?\(\d+,\s*\d+,\s*\d+(?:,\s*\d+(?:\.\d+)?)?\)|hsla?\(\d+,\s*\d+%?,\s*\d+%?,?\s*(?:,\s*\d+(?:\.\d+)?)?\))(?:[^#a-zA-Z0-9]|$)/g

/** Matches non-ASCII and non-numeric characters */
const NON_ASCII_NUMERIC_REGEX = /\P{ASCII}\p{Nd}/gu

/** Matches non-hex characters in color strings */
const NON_HEX_REGEX = /[^#0-9a-f]/gi

function MarkdownItColorPreview(md: MarkdownIt) {
  const replaceColor = (colorStr: string) => {
    colorStr = colorStr.trim()
    let color = colorStr.replace(NON_ASCII_NUMERIC_REGEX, '')

    if (color.startsWith('#')) {
      color = color.replace(NON_HEX_REGEX, '')
    }
    else {
      const index = color.lastIndexOf(')')
      if (index !== -1) {
        color = color.slice(0, index + 1)
      }
    }

    return `<span class='color-swatch' style='background-color: ${color}'></span>${colorStr} `
  }

  md.renderer.rules.text = (tokens, idx) => {
    let text = tokens[idx].content
    text = md.utils.escapeHtml(text)
    return text.replace(COLOR_REGEX, replaceColor)
  }
}

export default MarkdownItColorPreview
