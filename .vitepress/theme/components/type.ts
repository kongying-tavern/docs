export function mutable<T extends readonly any[] | Record<string, unknown>>(
  val: T,
) {
  return val as Mutable<typeof val>
}

export function NOOP() {}

export type Mutable<T> = { -readonly [P in keyof T]: T[P] }

export type HTMLElementCustomized<T> = HTMLElement & T

/**
 * @deprecated stop to use null
 * @see {@link https://github.com/sindresorhus/meta/discussions/7}
 */
export type Nullable<T> = T | null

export type Arrayable<T> = T | T[]
export type Awaitable<T> = Promise<T> | T
