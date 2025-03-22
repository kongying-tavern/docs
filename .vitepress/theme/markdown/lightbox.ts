/* eslint-disable no-console */
import type MarkdownIt from 'markdown-it'
import type { Options, PluginSimple } from 'markdown-it'

import type Renderer from 'markdown-it/lib/renderer.mjs'
import type { RenderRule } from 'markdown-it/lib/renderer.mjs'
import type Token from 'markdown-it/lib/token.mjs'

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path/posix'
import { normalizePath } from 'vite'
import { EXTERNAL_URL_RE } from '../shared'

interface ThumbhashMap {
  dataBase64: string
  dataUrl: string
  width: number
  height: number
  originalWidth: number
  originalHeight: number
  assetFileName: string
  assetFullFileName: string
  assetFullHash: string
  assetFileHash: string
  assetUrl: string
  assetUrlWithBase: string
}
const CACHE_THUMBHASH_MAP_PATH = '../../cache/@nolebase/vitepress-plugin-thumbnail-hash/thumbhashes/map.json'
const SAVED_THUMBHASH_MAP_PATH = '../../../src/_data/thumbhashMap.json'

function ensureThumbhashMap() {
  const cachedThumbhashMapPath = new URL(CACHE_THUMBHASH_MAP_PATH, import.meta.url)
  const savedThumbhashMapPath = new URL(SAVED_THUMBHASH_MAP_PATH, import.meta.url)

  try {
    if (existsSync(cachedThumbhashMapPath)) {
      const thumbhashMap = readFileSync(cachedThumbhashMapPath, 'utf-8')

      saveThumbhashMap(thumbhashMap)

      return JSON.parse(thumbhashMap) as {
        [key: string]: ThumbhashMap
      }
    }
  }
  catch {
    console.info('No thumbhash map found in cache, trying to use saved file...')

    if (existsSync(savedThumbhashMapPath)) {
      const thumbhashMap = readFileSync(savedThumbhashMapPath, 'utf-8')

      return JSON.parse(thumbhashMap) as {
        [key: string]: ThumbhashMap
      }
    }
    throw new Error('No thumbhash map found in cache or saved file')
  }

  function saveThumbhashMap(data: string) {
    try {
      writeFileSync(savedThumbhashMapPath, data, 'utf8')
      console.info(`Data successfully overwritten in ${savedThumbhashMapPath}`)
    }
    catch (error) {
      console.error('Error copying thumbhash map:', error)
    }
  }
}

/**
 * VitePress plugin to add `medium-zoom` lightbox to images.
 * @param {MarkdownIt} md - Markdown instance.
 */
const MarkdownItLightbox: PluginSimple = (md: MarkdownIt) => {
  // Store the original image renderer
  const thumbhashMap = ensureThumbhashMap()
  const imageRule = md.renderer.rules.image as RenderRule

  // Customize the image renderer.
  md.renderer.rules.image = (
    tokens: Token[],
    idx: number,
    options: Options,
    env: Record<string, unknown>,
    self: Renderer,
  ) => {
    if (!env.path && !env.relativePath)
      throw new Error('env.path and env.relativePath are required')

    const token = tokens[idx]
    const imgSrc = token.attrGet('src')

    token.attrSet('data-zoomable', 'true')

    if (!imgSrc) {
      return imageRule(tokens, idx, options, env, self)
    }
    // Skip external URLs
    if (EXTERNAL_URL_RE.test(imgSrc))
      return imageRule(tokens, idx, options, env, self)
    // Skip unsupported image formats
    if (!(['.png', '.jpg', '.jpeg'].some(ext => imgSrc.endsWith(ext)))) {
      // console.warn(`[WARN] unsupported image format for ${imgSrc}`)
      return imageRule(tokens, idx, options, env, self)
    }

    let resolvedImgSrc = decodeURIComponent(imgSrc)

    const props: {
      [name: string]: string | undefined
      src: string
      alt: string
      thumbhash?: string
      width?: string
      height?: string
      autoSizes?: string
      zoom?: string
    } = {
      src: imgSrc,
      alt: token.attrGet('alt') || '',
      thumbhash: undefined,
    }

    token.attrs?.forEach(([name, value]) => {
      if (name === 'src' || name === 'alt')
        return

      props[name] = value
    })

    // This section is basically the same as https://github.com/vuejs/vitepress/blob/3113dad002e60312ca7b679cf38b887196c33303/src/shared/shared.ts#L17
    if (!/^\.?\//.test(resolvedImgSrc)) {
      // Remove the leading slash for matching with the thumbhash map
      props.src = `./${decodeURIComponent(resolvedImgSrc)}`
    }

    // If there is a leading slash, means it is an absolute path from the root of the site
    if (resolvedImgSrc.startsWith('/')) {
      resolvedImgSrc = resolvedImgSrc.slice(1)
    }
    // Otherwise, it is a relative path from the current file
    else {
      // Get the directory of the current file first
      const relativePathDir = normalizePath(dirname(env.relativePath as string))
      // Resolve the relative path
      resolvedImgSrc = join(relativePathDir, resolvedImgSrc)
      // Remove the leading slash if any
      if (resolvedImgSrc.startsWith('/'))
        resolvedImgSrc = resolvedImgSrc.slice(1)
    }

    // Check if the resolved image source is in the thumbhash map
    const matchedThumbhashData = thumbhashMap?.[`public/${resolvedImgSrc}`]

    if (!matchedThumbhashData) {
      // Usually this should not happen
      console.warn(`[WARN] thumbhash data not found for ${resolvedImgSrc}`)
      return imageRule(tokens, idx, options, env, self)
    }

    // Apply all the attributes as
    // https://unlazy.byjohann.dev/placeholders/thumbhash.html
    // and https://unlazy.byjohann.dev/api/lazy-load.html
    // have stated
    props.thumbhash = matchedThumbhashData.dataBase64
    props.placeholderSrc = matchedThumbhashData.dataUrl
    props.width = matchedThumbhashData.originalWidth.toString()
    props.height = matchedThumbhashData.originalHeight.toString()
    props.autoSizes = 'true'
    props['data-zoomable'] = 'true'

    return `<Image ${Object.entries(props).map(([name, value]) => `${name}="${value}"`).join(' ')} />`
  }
}

export default MarkdownItLightbox
