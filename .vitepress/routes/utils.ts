import type { Component } from 'vue'
import type { ComponentMeta, LocaleRoute, MetaComponent } from './types'

export function extractComponentMeta<T = ComponentMeta>(
  component: MetaComponent<T>,
): T | null {
  return component?.meta ?? null
}

export function createRouteFromComponent(
  match: string,
  component: Component,
  additionalConfig?: Partial<LocaleRoute>,
): LocaleRoute {
  const meta = extractComponentMeta(component)

  return {
    match,
    component,
    options: meta?.routeOptions,
    locales: meta?.locales,
    data: meta?.data,
    i18n: meta?.i18n ?? true,
    ...additionalConfig,
  }
}
