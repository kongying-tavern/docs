/* eslint-disable ts/naming-convention */
/// <reference types="vite/client" />

interface ImportMetaEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __VP_HASH_MAP__: Record<string, string>
declare const __ALGOLIA__: boolean
declare const __CARBON__: boolean
declare const __VUE_PROD_DEVTOOLS__: boolean

declare module '*.md' {
  import type { PageData } from 'vitepress'
  import type { Component } from 'vue'

  const component: Component
  const __pageData: PageData

  export default component
  export { __pageData }
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent
  export default component
}

declare module '@siteData' {
  import type { SiteData } from 'vitepress'

  const data: SiteData
  export default data
}

declare module '@theme/index' {
  import type { Theme } from 'vitepress'

  const theme: Theme
  export default theme
}

type SnakeCaseToCamelCase<S> = S extends `${infer Prefix}_${infer Rest}`
  ? `${SnakeCaseToCamelCase<Prefix>}${Capitalize<SnakeCaseToCamelCase<Rest>>}`
  : S

/** 转换对象的所有下划线风格 key 为小驼峰风格的 key */
type SnakeCaseKeysToCamelCase<T extends Record<string, unknown>> = {
  [K in keyof T as SnakeCaseToCamelCase<K>]: T[K]
}

type Flatten<T> = {
  [K in keyof T]: T[K] extends object ? Flatten<T[K]> : T[K]
}

type FlattenWithKeys<T, Prefix extends string = ''> = {
  [K in keyof T]: T[K] extends object
    ? FlattenWithKeys<T[K], `${Prefix}${K & string}.`>
    : { [P in `${Prefix}${K & string}`]: T[K] }
}[keyof T]
