import type { PageData, SiteConfig } from 'vitepress'
import type { CustomConfig } from '../locales/types'
import type { LocaleConfigVal } from './types'

export function cfgDynamicTitleTemplate(
  pageData: PageData,
  siteConfig: SiteConfig,
): void {
  let titleTemplate: boolean | string
    = pageData.frontmatter.titleTemplate ?? siteConfig.userConfig.titleTemplate
  if (titleTemplate === null || titleTemplate === undefined) {
    const localeKey: string
      = pageData.relativePath === pageData.filePath
        ? pageData.relativePath.split('/', 1)[0]
        : 'root'
    const localeConfig: LocaleConfigVal
      = siteConfig.userConfig.locales![localeKey] ?? {}
    const templateMappings: CustomConfig['ui']['title']['templateMappings']
      = localeConfig.themeConfig?.ui.title.templateMappings ?? []
    for (const templateMapping of templateMappings) {
      if (
        templateMapping.test
        && templateMapping.test.test(pageData.relativePath)
      ) {
        titleTemplate = templateMapping.template
        break
      }
    }
  }
  pageData.titleTemplate = titleTemplate
}
