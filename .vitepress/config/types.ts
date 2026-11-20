import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../locales/types.ts'

export type LocaleConfigVal = LocaleSpecificConfig<
  CustomConfig & DefaultTheme.Config
>
