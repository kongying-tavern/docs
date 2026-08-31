import type { DefaultTheme, UserConfig } from 'vitepress'
import { DEFAULT_LOCALE } from '../locales/common/site'

export const rewritesConfig: UserConfig<DefaultTheme.Config>['rewrites'] = {
  [`${DEFAULT_LOCALE}/:splat*`]: ':splat*',
}
