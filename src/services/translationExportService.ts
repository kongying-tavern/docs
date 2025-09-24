import type { ExportOptions, ExportResult } from './enhancedTranslationService'
import type { TranslationEntry } from './jsonTranslationService'
import { enhancedTranslationService } from './enhancedTranslationService'

class TranslationExportService {
  /**
   * 导出翻译数据为 JSON 格式
   */
  async exportTranslations(
    entries: TranslationEntry[],
    options: ExportOptions,
  ): Promise<ExportResult> {
    const {
      locales = ['zh', 'en', 'ja'],
      format,
      includeMetadata,
      sorting,
      indentation,
      validation,
    } = options

    // 验证数据
    if (validation) {
      const validationResult = enhancedTranslationService.validateTranslations(entries)
      if (!validationResult.isValid) {
        throw new Error(`数据验证失败: ${validationResult.errors.length} 个错误`)
      }
    }

    // 构建每个语言的数据
    const localeData: Record<string, Record<string, unknown>> = {}

    for (const locale of locales) {
      localeData[locale] = await this.buildLocaleData(entries, locale, {
        includeMetadata,
        sorting,
      })
    }

    // 生成文件
    const files = format === 'single'
      ? this.generateSingleFile(localeData, indentation)
      : this.generateMultipleFiles(localeData, indentation)

    // 生成摘要
    const summary = {
      totalEntries: entries.filter(e => !e.isDeleted).length,
      localesCount: locales.length,
      hasModifications: entries.some(e => e.isModified),
      exportedAt: new Date().toISOString(),
    }

    return { files, summary }
  }

  /**
   * 复制内容到剪贴板
   */
  async copyToClipboard(content: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(content)
        return true
      }
      else {
        // 降级方案
        return this.fallbackCopyToClipboard(content)
      }
    }
    catch (error) {
      console.error('复制到剪贴板失败:', error)
      return false
    }
  }

  /**
   * 降级复制方案
   */
  private fallbackCopyToClipboard(content: string): boolean {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = content
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      return success
    }
    catch (error) {
      console.error('降级复制方案失败:', error)
      return false
    }
  }

  /**
   * 下载文件
   */
  downloadFile(filename: string, content: string, mimeType = 'application/json'): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  /**
   * 构建单个语言的完整数据结构
   */
  private async buildLocaleData(
    entries: TranslationEntry[],
    locale: string,
    options: { includeMetadata: boolean, sorting: ExportOptions['sorting'] },
  ): Promise<Record<string, unknown>> {
    const data: Record<string, unknown> = {}

    // 构建翻译数据
    for (const entry of entries) {
      if (entry.isDeleted)
        continue

      const translation = entry.translations[locale]
      if (translation !== undefined && translation !== '') {
        this.setNestedValue(data, entry.path, this.parseValue(translation))
      }
    }

    // 加载原始数据以获取元数据
    if (options.includeMetadata) {
      try {
        const originalData = await this.loadOriginalLocaleData(locale)
        // 合并元数据，保持翻译数据优先
        this.mergeMetadata(data, originalData)
      }
      catch (error) {
        console.warn(`无法加载 ${locale} 的原始数据:`, error)
      }
    }

    // 排序
    if (options.sorting !== 'original') {
      return this.sortObjectKeys(data, options.sorting)
    }

    return data
  }

  /**
   * 解析值，处理特殊数据结构
   */
  private parseValue(value: string): unknown {
    try {
      const parsed = JSON.parse(value)
      return enhancedTranslationService.parseSpecialValues(parsed)
    }
    catch {
      return value
    }
  }

  /**
   * 加载原始语言数据
   */
  private async loadOriginalLocaleData(locale: string): Promise<Record<string, unknown>> {
    const response = await import(`../../.vitepress/locales/json/${locale}.json`)
    return response.default || response
  }

  /**
   * 合并元数据到数据对象
   */
  private mergeMetadata(target: Record<string, unknown>, source: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(source)) {
      if (!(key in target)) {
        target[key] = enhancedTranslationService.processSpecialValues(value)
      }
      else if (
        typeof target[key] === 'object'
        && typeof value === 'object'
        && target[key] !== null
        && value !== null
        && !Array.isArray(target[key])
        && !Array.isArray(value)
      ) {
        this.mergeMetadata(
          target[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        )
      }
    }
  }

  /**
   * 设置嵌套对象值
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {}
      }
      current = current[key] as Record<string, unknown>
    }

    current[keys[keys.length - 1]] = value
  }

  /**
   * 递归排序对象键
   */
  private sortObjectKeys(
    obj: Record<string, unknown>,
    sorting: ExportOptions['sorting'],
  ): Record<string, unknown> {
    const sorted: Record<string, unknown> = {}

    let keys: string[]
    if (sorting === 'alphabetical') {
      keys = Object.keys(obj).sort()
    }
    else if (sorting === 'categorical') {
      keys = this.sortKeysCategorically(Object.keys(obj))
    }
    else {
      keys = Object.keys(obj)
    }

    for (const key of keys) {
      const value = obj[key]
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sorted[key] = this.sortObjectKeys(value as Record<string, unknown>, sorting)
      }
      else {
        sorted[key] = value
      }
    }

    return sorted
  }

  /**
   * 按分类对键进行排序
   */
  private sortKeysCategorically(keys: string[]): string[] {
    const categoryOrder = [
      'title',
      'titleTemplate',
      'description',
      'head', // Meta 字段
      'siteTitle',
      'keyword',
      'image',
      'logo', // 基础配置
      'ui',
      'auth',
      'forum', // 功能模块
      'META_URL',
      'META_TITLE', // 系统常量
    ]

    const categorized: Record<string, string[]> = {}
    const uncategorized: string[] = []

    // 分类
    for (const key of keys) {
      let matched = false
      for (const category of categoryOrder) {
        if (key === category || key.startsWith(`${category}.`)) {
          if (!categorized[category]) {
            categorized[category] = []
          }
          categorized[category].push(key)
          matched = true
          break
        }
      }
      if (!matched) {
        uncategorized.push(key)
      }
    }

    // 重新组合
    const result: string[] = []
    for (const category of categoryOrder) {
      if (categorized[category]) {
        result.push(...categorized[category].sort())
      }
    }
    result.push(...uncategorized.sort())

    return result
  }

  /**
   * 生成单个包含所有语言的文件
   */
  private generateSingleFile(
    localeData: Record<string, Record<string, unknown>>,
    indentation: number,
  ): ExportResult['files'] {
    const content = JSON.stringify(localeData, null, indentation)
    return [{
      filename: 'translations.json',
      content,
      size: new Blob([content]).size,
    }]
  }

  /**
   * 生成每个语言单独的文件
   */
  private generateMultipleFiles(
    localeData: Record<string, Record<string, unknown>>,
    indentation: number,
  ): ExportResult['files'] {
    return Object.entries(localeData).map(([locale, data]) => {
      const content = JSON.stringify(data, null, indentation)
      return {
        filename: `${locale}.json`,
        content,
        locale,
        size: new Blob([content]).size,
      }
    })
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
}

export const translationExportService = new TranslationExportService()
