import { isObject } from 'lodash-es'

export const escapeHtml = (unsafeHTML: string): string =>
  unsafeHTML
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;')

const markdownLinkRegexp = /.md((\?|#).*)?$/

// single quote will break @vue/compiler-sfc
export const stringifyProp = (data: unknown): string =>
  JSON.stringify(data).replace(/'/g, '&#39')

/**
 * Determine a link is http link or not
 *
 * - http://github.com
 * - https://github.com
 * - //github.com
 */
export const isLinkHttp = (link: string): boolean =>
  /^(https?:)?\/\//.test(link)

/**
 * Determine a link is ftp link or not
 */
export const isLinkFtp = (link: string): boolean => link.startsWith('ftp://')

/**
 * Determine a link is external or not
 */
export const isLinkExternal = (link: string, base = '/'): boolean => {
  // http link or ftp link
  if (isLinkHttp(link) || isLinkFtp(link)) {
    return true
  }

  // absolute link that does not start with `base` and does not end with `.md`
  if (
    link.startsWith('/') &&
    !link.startsWith(base) &&
    !markdownLinkRegexp.test(link)
  ) {
    return true
  }

  return false
}

export const isRelativeLink = (link: string) =>
  /^(?!www\.|http[s]?:\/\/|[A-Za-z]:\\|\/\/).*/.test(link)

const concatLink = (link: string, base: string): string =>
  `/${base}/${link}`.replace(/\/+/giu, '/')

const modifyLink = (obj: Record<string, any>, base: string): any => {
  if (Array.isArray(obj)) {
    return obj.map((item) => modifyLink(item, base))
  }
  if (isObject(obj)) {
    const newObj: Record<string, any> = {}
    for (const key in obj) {
      if (Array.isArray(obj[key]) || typeof obj[key] === 'object') {
        newObj[key] = modifyLink(obj[key], base)
      } else if (key === 'link' && isRelativeLink(obj[key])) {
        newObj[key] = concatLink(obj[key], base)
        if (isLinkExternal(obj[key])) newObj.target = '_blank'
      } else {
        newObj[key] = obj[key]
      }
    }
    return newObj
  }
  return obj
}

const modifyKey = (obj: any, base: string) => {
  const newObj: Record<string, any> = {}
  for (const key in obj) {
    if (key.startsWith('/') && base !== '') {
      const newKey = concatLink(key, base)
      newObj[newKey] = obj[key]
    } else {
      newObj[key] = obj[key]
    }
  }
  return newObj
}

export const baseHelper = (obj: any, base: string): any =>
  modifyKey(modifyLink(obj, base), base)

export const hash = (str: string) => {
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

export const toCamelCaseObject = <T extends Record<string, unknown>>(
  obj: T,
): SnakeCaseKeysToCamelCase<T> => {
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
