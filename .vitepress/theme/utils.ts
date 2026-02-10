/* eslint-disable regexp/no-unused-capturing-group */
import { isObject } from 'lodash-es'

// Import from centralized text utils
import { camelCase } from './utils/text'

// Re-export from centralized text utils
export { escapeHtml } from './utils/text'

const markdownLinkRegexp = /.md((\?|#).*)?$/

// single quote will break @vue/compiler-sfc
export function stringifyProp(data: unknown): string {
  return JSON.stringify(data).replace(/'/g, '&#39')
}

/**
 * Determine a link is http link or not
 *
 * - http://github.com
 * - https://github.com
 * - //github.com
 */
export function isLinkHttp(link: string): boolean {
  return /^(https?:)?\/\//.test(link)
}

/**
 * Determine a link is ftp link or not
 */
export const isLinkFtp = (link: string): boolean => link.startsWith('ftp://')

/**
 * Determine a link is external or not
 */
export function isLinkExternal(link: string, base = '/'): boolean {
  // http link or ftp link
  if (isLinkHttp(link) || isLinkFtp(link)) {
    return true
  }

  // absolute link that does not start with `base` and does not end with `.md`
  if (
    link.startsWith('/')
    && !link.startsWith(base)
    && !markdownLinkRegexp.test(link)
  ) {
    return true
  }

  return false
}

export function isRelativeLink(link: string) {
  return /^(?!www\.|https?:\/\/|[A-Za-z]:\\|\/\/).*/.test(link)
}

function concatLink(link: string, base: string): string {
  return `/${base}/${link}`.replace(/\/+/gu, '/')
}

function modifyLink(obj: unknown, base: string): unknown {
  if (Array.isArray(obj)) {
    return obj.map(item => modifyLink(item, base))
  }
  if (isObject(obj)) {
    const objRecord = obj as Record<string, unknown>
    const newObj: Record<string, unknown> = {}
    for (const key in objRecord) {
      const value = objRecord[key]
      if (Array.isArray(value) || typeof value === 'object') {
        newObj[key] = modifyLink(value, base)
      }
      else if (key === 'link' && typeof value === 'string' && isRelativeLink(value)) {
        newObj[key] = concatLink(value, base)
        if (isLinkExternal(value))
          newObj.target = '_blank'
      }
      else {
        newObj[key] = value
      }
    }
    return newObj
  }
  return obj
}

function modifyKey(obj: Record<string, unknown>, base: string) {
  const newObj: Record<string, unknown> = {}
  for (const key in obj) {
    if (key.startsWith('/') && base !== '') {
      const newKey = concatLink(key, base)
      newObj[newKey] = obj[key]
    }
    else {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

export function baseHelper<T extends Record<string, unknown> | unknown[]>(obj: T, base: string): T {
  const modifiedLink = modifyLink(obj, base)
  if (Array.isArray(modifiedLink)) {
    return modifiedLink as T
  }
  return modifyKey(modifiedLink as Record<string, unknown>, base) as T
}

// Re-export from centralized text utils
export { hash } from './utils/text'

export function removeQueryParam(param: string) {
  const urlObj = new URL(location.href)
  urlObj.searchParams.delete(param)
  const url = urlObj.toString()
  window.history.replaceState({}, '', url)
  return url
}

export function toCamelCaseObject<T extends Record<string, unknown>>(
  obj: T,
): SnakeCaseKeysToCamelCase<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [camelCase(key), value]),
  ) as SnakeCaseKeysToCamelCase<T>
}

export function ensureStartingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export function getLangPath(localeIndex: string) {
  return localeIndex === 'root' ? '/' : `/${localeIndex}/`
}

// https://github.com/evanw/thumbhash/blob/main/examples/browser/index.html
export function binaryToBase64(binary: Uint8Array) {
  return btoa(String.fromCharCode(...binary))
}

export function equalLangCode(lang: string, _lang: string) {
  return getLangCode(lang) === getLangCode(_lang)
}

export function equalScriptCode(lang: string, _lang: string) {
  return getScriptCode(lang) === getScriptCode(_lang)
}

export function equalCountryCode(lang: string, _lang: string) {
  return getCountryCode(lang) === getCountryCode(_lang)
}

export function equalLocaleCode(lang: string, _lang: string) {
  return lang.toLowerCase() === _lang.toLowerCase()
}

export function getLangCode(lang: string) {
  return lang.split('-')[0].toLowerCase()
}

export function getScriptCode(lang: string) {
  return lang.split('-')[1].charAt(0).toUpperCase() + lang.split('-')[1].slice(1).toLowerCase()
}

export function getCountryCode(lang: string) {
  return lang.split('-')[2].toUpperCase()
}

export function stripTrailingSlashInPath() {
  if (typeof window === 'undefined')
    return
  const { pathname, search, hash } = window.location
  if (pathname !== '/' && pathname.endsWith('/')) {
    const newPath = pathname.replace(/\/$/, '')
    const newUrl = newPath + search + hash
    history.replaceState(history.state, '', newUrl)
  }
}
