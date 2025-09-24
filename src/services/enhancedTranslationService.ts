import type { TranslationEntry } from './jsonTranslationService'

export type FieldType = 'text' | 'regex' | 'meta' | 'json' | 'readonly' | 'array'
export type FieldLevel = 'basic' | 'advanced' | 'system'
export type FieldCategory = 'ui' | 'auth' | 'forum' | 'meta' | 'system' | 'content'

export interface FieldMetadata {
  type: FieldType
  category: FieldCategory
  level: FieldLevel
  isTranslatable: boolean
  validator?: (value: string) => boolean
  template?: string[]
  description?: string
}

export interface SerializedRegex {
  __regex__: string
  __flags__: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Array<{
    path: string
    message: string
    severity: 'error' | 'warning'
  }>
}

export interface ExportOptions {
  locales?: string[]
  format: 'single' | 'split'
  includeMetadata: boolean
  sorting: 'alphabetical' | 'categorical' | 'original'
  indentation: number
  validation: boolean
}

export interface ExportResult {
  files: Array<{
    filename: string
    content: string
    locale?: string
    size: number
  }>
  summary: {
    totalEntries: number
    localesCount: number
    hasModifications: boolean
    exportedAt: string
  }
}

class EnhancedTranslationService {
  private fieldMetadataCache = new Map<string, FieldMetadata>()

  /**
   * 智能分析字段类型和特征
   */
  analyzeField(path: string, value: unknown): FieldMetadata {
    // 检查缓存
    if (this.fieldMetadataCache.has(path)) {
      return this.fieldMetadataCache.get(path)!
    }

    const metadata = this.computeFieldMetadata(path, value)
    this.fieldMetadataCache.set(path, metadata)
    return metadata
  }

  /**
   * 计算字段元数据
   */
  private computeFieldMetadata(path: string, value: unknown): FieldMetadata {
    // 尝试解析字符串值为JSON
    let parsedValue = value
    if (typeof value === 'string') {
      try {
        parsedValue = JSON.parse(value)
      }
      catch {
        // 解析失败，保持原值
      }
    }

    // 系统常量字段
    if (path.startsWith('META_') || path === 'LOCAL_CODE' || path === 'LOCAL_BASE') {
      return {
        type: 'readonly',
        category: 'system',
        level: 'system',
        isTranslatable: false,
        description: '系统常量，不建议修改',
      }
    }

    // HTML Head 配置
    if (path === 'head' || path.includes('.head')) {
      return {
        type: 'meta',
        category: 'meta',
        level: 'advanced',
        isTranslatable: true,
        description: 'HTML Head 标签配置',
      }
    }

    // 正则表达式对象
    if (this.isRegexObject(parsedValue)) {
      return {
        type: 'regex',
        category: 'system',
        level: 'advanced',
        isTranslatable: false,
        description: '正则表达式配置',
      }
    }

    // Meta 标签数组 ["meta", {...}]
    if (this.isMetaTagArray(parsedValue)) {
      return {
        type: 'meta',
        category: 'meta',
        level: 'advanced',
        isTranslatable: true,
        description: 'HTML Meta 标签配置',
      }
    }

    // 对象数组
    if (this.isObjectArray(parsedValue)) {
      return {
        type: 'array',
        category: this.getCategoryFromPath(path),
        level: 'advanced',
        isTranslatable: true,
        description: '对象数组配置',
      }
    }

    // 复杂 JSON 对象
    if (this.isComplexObject(parsedValue)) {
      return {
        type: 'json',
        category: this.getCategoryFromPath(path),
        level: 'advanced',
        isTranslatable: true,
        description: '复杂JSON对象',
      }
    }

    // 普通文本字段
    return {
      type: 'text',
      category: this.getCategoryFromPath(path),
      level: 'basic',
      isTranslatable: true,
      description: '普通文本内容',
    }
  }

  /**
   * 检查是否为正则表达式对象
   */
  private isRegexObject(value: unknown): value is SerializedRegex {
    return (
      typeof value === 'object'
      && value !== null
      && '__regex__' in value
      && '__flags__' in value
    )
  }

  /**
   * 检查是否为 Meta 标签数组
   */
  private isMetaTagArray(value: unknown): boolean {
    return (
      Array.isArray(value)
      && value.length >= 2
      && value[0] === 'meta'
      && typeof value[1] === 'object'
      && value[1] !== null
    )
  }

  /**
   * 检查是否为对象数组
   */
  private isObjectArray(value: unknown): boolean {
    return (
      Array.isArray(value)
      && value.length > 0
      && value.every(item =>
        typeof item === 'object'
        && item !== null
        && !Array.isArray(item),
      )
    )
  }

  /**
   * 检查是否为复杂对象
   */
  private isComplexObject(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false
    }

    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj)

    // 有3个以上键的对象认为是复杂对象
    return keys.length > 2
  }

  /**
   * 从路径推断分类
   */
  private getCategoryFromPath(path: string): FieldCategory {
    if (path.startsWith('ui.'))
      return 'ui'
    if (path.startsWith('auth.') || path.includes('login') || path.includes('oauth'))
      return 'auth'
    if (path.startsWith('forum.'))
      return 'forum'
    if (path.startsWith('META_') || path === 'LOCAL_CODE' || path === 'LOCAL_BASE')
      return 'system'
    if (path.includes('title') || path.includes('description') || path.includes('head'))
      return 'meta'
    return 'content'
  }

  /**
   * 验证翻译数据
   */
  validateTranslations(entries: TranslationEntry[]): ValidationResult {
    const errors: ValidationResult['errors'] = []

    for (const entry of entries) {
      const metadata = this.analyzeField(entry.path, entry.translations.zh)

      // 验证必需字段
      if (metadata.isTranslatable && !entry.isDeleted) {
        for (const locale of ['zh', 'en', 'ja']) {
          const value = entry.translations[locale]
          if (!value || value.trim() === '') {
            errors.push({
              path: `${entry.path}.${locale}`,
              message: `缺少 ${locale} 翻译`,
              severity: 'warning',
            })
          }
        }
      }

      // 验证正则表达式
      if (metadata.type === 'regex') {
        for (const [locale, value] of Object.entries(entry.translations)) {
          try {
            const parsed = JSON.parse(value)
            if (this.isRegexObject(parsed)) {
              new RegExp(parsed.__regex__, parsed.__flags__)
            }
          }
          catch (error) {
            errors.push({
              path: `${entry.path}.${locale}`,
              message: `正则表达式语法错误: ${error instanceof Error ? error.message : '未知错误'}`,
              severity: 'error',
            })
          }
        }
      }

      // 验证 JSON 格式
      if (metadata.type === 'json' || metadata.type === 'meta') {
        for (const [locale, value] of Object.entries(entry.translations)) {
          try {
            JSON.parse(value)
          }
          catch (error) {
            errors.push({
              path: `${entry.path}.${locale}`,
              message: `JSON 格式错误: ${error instanceof Error ? error.message : '未知错误'}`,
              severity: 'error',
            })
          }
        }
      }
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
    }
  }

  /**
   * 处理特殊数据结构的序列化
   */
  processSpecialValues(value: unknown): unknown {
    if (value instanceof RegExp) {
      return {
        __regex__: value.source,
        __flags__: value.flags,
      }
    }

    if (Array.isArray(value)) {
      return value.map(item => this.processSpecialValues(item))
    }

    if (value && typeof value === 'object') {
      const processed: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        processed[key] = this.processSpecialValues(val)
      }
      return processed
    }

    return value
  }

  /**
   * 反序列化特殊数据结构
   */
  parseSpecialValues(value: unknown): unknown {
    if (this.isRegexObject(value)) {
      return new RegExp(value.__regex__, value.__flags__)
    }

    if (Array.isArray(value)) {
      return value.map(item => this.parseSpecialValues(item))
    }

    if (value && typeof value === 'object') {
      const parsed: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(value)) {
        parsed[key] = this.parseSpecialValues(val)
      }
      return parsed
    }

    return value
  }

  /**
   * 获取字段的编辑提示信息
   */
  getFieldHints(path: string, type: FieldType): string[] {
    const hints: string[] = []

    switch (type) {
      case 'regex':
        hints.push('支持 JavaScript 正则表达式语法')
        hints.push('常用标志: i(忽略大小写), g(全局匹配), m(多行模式)')
        break
      case 'meta':
        hints.push('HTML meta 标签配置')
        hints.push('格式: ["meta", {"property": "og:title", "content": "内容"}]')
        break
      case 'json':
        hints.push('JSON 对象，注意语法正确性')
        hints.push('支持嵌套对象和数组')
        break
      case 'array':
        hints.push('对象数组，支持添加、删除和编辑条目')
        hints.push('每个条目可以包含多个字段（如 label, value）')
        break
      case 'readonly':
        hints.push('系统配置字段，修改需谨慎')
        hints.push('可能影响应用的核心功能')
        break
      default:
        hints.push('普通文本内容')
    }

    // 基于路径的特殊提示
    if (path.includes('url') || path.includes('link')) {
      hints.push('URL 格式，确保链接有效')
    }
    if (path.includes('color')) {
      hints.push('颜色值，支持 hex、rgb 等格式')
    }

    return hints
  }

  /**
   * 获取建议的编辑器类型
   */
  getRecommendedEditor(metadata: FieldMetadata): 'inline' | 'modal' | 'readonly' {
    if (!metadata.isTranslatable || metadata.type === 'readonly') {
      return 'readonly'
    }

    if (metadata.type === 'text' && metadata.level === 'basic') {
      return 'inline'
    }

    return 'modal'
  }

  /**
   * 清除字段元数据缓存
   */
  clearMetadataCache(): void {
    this.fieldMetadataCache.clear()
  }
}

export const enhancedTranslationService = new EnhancedTranslationService()
