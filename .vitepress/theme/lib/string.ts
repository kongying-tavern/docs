const UNDERSCORE_LOWER_REGEX = /_([a-z])/g

const SINGLE_QUOTE_REGEX = /'/g

function camelCase(str: string): string {
  return str.replace(UNDERSCORE_LOWER_REGEX, (_, letter) => letter.toUpperCase())
}

// single quote will break @vue/compiler-sfc
export function stringifyProp(data: unknown): string {
  return JSON.stringify(data).replace(SINGLE_QUOTE_REGEX, '&#39;')
}

export function hash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash &= hash // Convert to 32bit integer
  }
  return hash
}

export function toCamelCaseObject<T extends Record<string, unknown>>(
  obj: T,
): SnakeCaseKeysToCamelCase<T> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [camelCase(key), value]),
  ) as SnakeCaseKeysToCamelCase<T>
}
