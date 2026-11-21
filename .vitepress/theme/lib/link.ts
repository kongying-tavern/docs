import { isObject } from 'lodash-es'

const markdownLinkRegexp = /.md(?:[?#].*)?$/

const HTTP_LINK_REGEX = /^(?:https?:)?\/\//

const RELATIVE_LINK_REGEX = /^(?!www\.|https?:\/\/|[A-Za-z]:\\|\/\/).*/

const MULTIPLE_SLASH_REGEX = /\/+/gu

/**
 * Determine a link is http link or not
 *
 * - http://github.com
 * - https://github.com
 * - //github.com
 */
export function isLinkHttp(link: string): boolean {
  return HTTP_LINK_REGEX.test(link)
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
  return RELATIVE_LINK_REGEX.test(link)
}

function concatLink(link: string, base: string): string {
  return `/${base}/${link}`.replace(MULTIPLE_SLASH_REGEX, '/')
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

/** Rewrite every relative `link` and root-absolute key against `base`. */
export function baseHelper<T extends Record<string, unknown> | unknown[]>(obj: T, base: string): T {
  const modifiedLink = modifyLink(obj, base)
  if (Array.isArray(modifiedLink)) {
    return modifiedLink as T
  }
  return modifyKey(modifiedLink as Record<string, unknown>, base) as T
}
