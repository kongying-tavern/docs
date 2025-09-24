/* eslint-disable regexp/no-super-linear-backtracking */
/* eslint-disable no-control-regex */
import type { SiteData } from 'vitepress'

export const EXTERNAL_URL_RE = /^(?:[a-z]+:|\/\/)/i

const HASH_RE = /#.*$/
const HASH_OR_QUERY_RE = /[?#].*$/
const INDEX_OR_EXT_RE = /(?:(^|\/)index)?\.(?:md|html)$/

export const inBrowser = typeof document !== 'undefined'

export function isActive(
  currentPath: string,
  matchPath?: string,
  asRegex: boolean = false,
): boolean {
  if (matchPath === undefined) {
    return false
  }

  currentPath = normalize(`/${currentPath}`)

  if (asRegex) {
    return new RegExp(matchPath).test(currentPath)
  }

  if (normalize(matchPath) !== currentPath) {
    return false
  }

  const hashMatch = matchPath.match(HASH_RE)

  if (hashMatch) {
    return (inBrowser ? location.hash : '') === hashMatch[0]
  }

  return true
}

export function normalize(path: string): string {
  return decodeURI(path)
    .replace(HASH_OR_QUERY_RE, '')
    .replace(INDEX_OR_EXT_RE, '$1')
}

export function isExternal(path: string): boolean {
  return EXTERNAL_URL_RE.test(path)
}

export function getLocaleForPath(
  siteData: SiteData | undefined,
  relativePath: string,
): string {
  return (
    Object.keys(siteData?.locales || {}).find(
      key =>
        key !== 'root'
        && !isExternal(key)
        && isActive(relativePath, `/${key}/`, true),
    ) || 'root'
  )
}

// https://github.com/rollup/rollup/blob/fec513270c6ac350072425cc045db367656c623b/src/utils/sanitizeFileName.ts

const INVALID_CHAR_REGEX = /[\u0000-\u001F"#$&*+,:;<=>?[\]^`{|}\u007F]/g
const DRIVE_LETTER_REGEX = /^[a-z]:/i

export function sanitizeFileName(name: string): string {
  const match = DRIVE_LETTER_REGEX.exec(name)
  const driveLetter = match ? match[0] : ''

  return (
    driveLetter
    + name
      .slice(driveLetter.length)
      .replace(INVALID_CHAR_REGEX, '_')
      .replace(/(^|\/)_+(?=[^/]*$)/, '$1')
  )
}

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

const KNOWN_EXTENSIONS = new Set()

export function treatAsHtml(filename: string): boolean {
  if (KNOWN_EXTENSIONS.size === 0) {
    const extraExts
      // eslint-disable-next-line node/prefer-global/process
      = (typeof process === 'object' && process.env?.VITE_EXTRA_EXTENSIONS)
        || (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_EXTRA_EXTENSIONS
        || ''

    // md, html? are intentionally omitted
    ;(
      `3g2,3gp,aac,ai,apng,au,avif,bin,bmp,cer,class,conf,crl,css,csv,dll,`
      + `doc,eps,epub,exe,gif,gz,ics,ief,jar,jpe,jpeg,jpg,js,json,jsonld,m4a,`
      + `man,mid,midi,mjs,mov,mp2,mp3,mp4,mpe,mpeg,mpg,mpp,oga,ogg,ogv,ogx,`
      + `opus,otf,p10,p7c,p7m,p7s,pdf,png,ps,qt,roff,rtf,rtx,ser,svg,t,tif,`
      + `tiff,tr,ts,tsv,ttf,txt,vtt,wav,weba,webm,webp,woff,woff2,xhtml,xml,`
      + `yaml,yml,zip${
        extraExts && typeof extraExts === 'string' ? `,${extraExts}` : ''
      }`
    )
      .split(',')
      .forEach(ext => KNOWN_EXTENSIONS.add(ext))
  }

  const ext = filename.split('.').pop()

  return ext == null || !KNOWN_EXTENSIONS.has(ext.toLowerCase())
}

// https://github.com/sindresorhus/escape-string-regexp/blob/ba9a4473850cb367936417e97f1f2191b7cc67dd/index.js
export function escapeRegExp(str: string) {
  return str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&').replace(/-/g, '\\x2d')
}

/**
 * @internal
 * @deprecated Use escapeHtmlBasic from @/utils/text instead
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/&(?![\w#]+;)/g, '&amp;')
}

export function enableTransitions() {
  return (
    'startViewTransition' in document
    && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
  )
}

export class LRUCache<K, V> {
  private max: number
  private cache: Map<K, V>

  constructor(max: number = 10) {
    this.max = max
    this.cache = new Map<K, V>()
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (item !== undefined) {
      // refresh key
      this.cache.delete(key)
      this.cache.set(key, item)
    }
    return item
  }

  set(key: K, val: V): void {
    // refresh key
    if (this.cache.has(key))
      this.cache.delete(key)
    // evict oldest
    else if (this.cache.size === this.max)
      this.cache.delete(this.first()!)
    this.cache.set(key, val)
  }

  first(): K | undefined {
    return this.cache.keys().next().value
  }

  find(fn: (v: V, k: K, self: LRUCache<K, V>) => boolean): V | undefined {
    for (const [key, value] of this.cache.entries()) {
      if (fn(value, key, this)) {
        return value
      }
    }
    return undefined
  }

  delete(key: K): boolean {
    if (this.cache.has(key)) {
      const deleted = this.cache.delete(key)
      return deleted
    }
    return false
  }

  clear(): void {
    this.cache.clear()
  }
}
