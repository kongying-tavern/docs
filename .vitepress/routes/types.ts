import type { LocaleSpecificConfig, PageData } from 'vitepress'
import type { Component } from 'vue'

export interface ComponentMeta {
  routeOptions?: Record<string, string[]>
  locales?: Record<string, LocaleSpecificConfig>
  data?: Partial<PageData>
  i18n?: boolean
  [key: string]: unknown
}

export type MetaComponent<T = ComponentMeta> = Component & { meta?: T }

export interface LocaleRoute {
  match: string
  component: Component
  locales?: Record<string, LocaleSpecificConfig>
  options?: Record<string, string[]>
  path?: string
  data?: Partial<PageData>
  i18n?: boolean
}
