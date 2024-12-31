import { mergeWith, union } from 'lodash-es'
import sanitizeHtml, { type IOptions } from 'sanitize-html'

interface SanitizeHtmlOptions extends IOptions {}

const defaultOptions: SanitizeHtmlOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
    'svg',
    'g',
    'path',
    'mask',
  ]),
  allowedAttributes: {
    a: ['href', 'title'],
    span: ['style'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
}

function mergeOptions(
  defaultOpts: SanitizeHtmlOptions,
  customOpts?: Partial<SanitizeHtmlOptions>,
): SanitizeHtmlOptions {
  return mergeWith({}, defaultOpts, customOpts, (objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      return union(objValue, srcValue)
    }
    return undefined
  })
}

function sanitize(
  dirtyHtml: string,
  customOptions?: Partial<SanitizeHtmlOptions>,
): string {
  const options = mergeOptions(defaultOptions, customOptions)
  return sanitizeHtml(dirtyHtml, options)
}

export { sanitize as sanitizeHtml }
