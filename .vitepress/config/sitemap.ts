import type { DefaultTheme, UserConfig } from 'vitepress'
import { hostname } from './common'

export const sitemapConfig: UserConfig<DefaultTheme.Config>['sitemap'] = {
  hostname,
}
