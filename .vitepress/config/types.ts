import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../locales/types'

export type LocaleConfigVal = LocaleSpecificConfig<
  CustomConfig & DefaultTheme.Config
>
