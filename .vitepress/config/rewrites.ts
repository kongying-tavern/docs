import type { DefaultTheme, UserConfig } from 'vitepress'

export const rewritesConfig: UserConfig<DefaultTheme.Config>['rewrites'] = {
  'zh/:splat*': ':splat*',
}
