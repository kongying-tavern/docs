/**
 * @see https://spec.commonmark.org/0.29/#line-ending
 */
export const NEWLINES_RE = /\r\n?|\n/g

// single quote will break @vue/compiler-sfc
export const stringifyProp = (data: unknown): string =>
  JSON.stringify(data).replace(/'/g, '&#39')

export const escapeHtml = (unsafeHTML: string): string =>
  unsafeHTML
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&#039;')

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isBoolean = (val: any): val is boolean => typeof val === 'boolean'
// eslint-disable-next-line
export const isFunction = <T extends Function>(val: any): val is T =>
  typeof val === 'function'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNumber = (val: any): val is number => typeof val === 'number'
export const isString = (val: unknown): val is string => typeof val === 'string'
export const isRegExp = (val: unknown): val is RegExp => val instanceof RegExp
/* String helper */

export const startsWith = (str: unknown, prefix: string): boolean =>
  isString(str) && str.startsWith(prefix)

export const endsWith = (str: unknown, suffix: string): boolean =>
  isString(str) && str.endsWith(suffix)

/**
 * Check if a value is plain object, with generic type support
 */
export const isPlainObject = <T extends Record<any, any> = Record<any, any>>(
  val: unknown
): val is T => Object.prototype.toString.call(val) === '[object Object]'

const markdownLinkRegexp = /.md((\?|#).*)?$/

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

/* Object helper */

export const entries = Object.entries
export const fromEntries = Object.fromEntries
export const keys = Object.keys
export const values = Object.values
