/* eslint-disable regexp/no-unused-capturing-group */
import { isObject } from 'lodash-es'

export function escapeHtml(unsafeHTML: string): string {
  return unsafeHTML
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;')
}

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

function modifyLink(obj: Record<string, any>, base: string): any {
  if (Array.isArray(obj)) {
    return obj.map(item => modifyLink(item, base))
  }
  if (isObject(obj)) {
    const newObj: Record<string, any> = {}
    for (const key in obj) {
      if (Array.isArray(obj[key]) || typeof obj[key] === 'object') {
        newObj[key] = modifyLink(obj[key], base)
      }
      else if (key === 'link' && isRelativeLink(obj[key])) {
        newObj[key] = concatLink(obj[key], base)
        if (isLinkExternal(obj[key]))
          newObj.target = '_blank'
      }
      else {
        newObj[key] = obj[key]
      }
    }
    return newObj
  }
  return obj
}

function modifyKey(obj: any, base: string) {
  const newObj: Record<string, any> = {}
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
  return modifyKey(modifyLink(obj, base), base) as T
}

export function hash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash &= hash // Convert to 32bit integer
  }
  return hash
}

export function camelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

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
  const { pathname, search, hash } = window.location
  if (pathname !== '/' && pathname.endsWith('/')) {
    const newPath = pathname.replace(/\/$/, '')
    const newUrl = newPath + search + hash
    history.replaceState(history.state, '', newUrl)
  }
}
