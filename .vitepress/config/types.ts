import type { DefaultTheme, LocaleSpecificConfig, UserConfig } from 'vitepress'
import type { CustomConfig } from '../locales/types'

export type ConfigureFuncType = Pick<
  UserConfig<DefaultTheme.Config>,
  'transformHead' | 'transformPageData'
>

export type LocaleConfigVal = LocaleSpecificConfig<
  CustomConfig & DefaultTheme.Config
>
