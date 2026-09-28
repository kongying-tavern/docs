/** 替换 i18n 词条中的 `{key}` 占位符；与 locale 词条格式解耦，供服务层与组件层共用 */
export function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  )
}
