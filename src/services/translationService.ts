import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'
import type { CustomConfig } from '../../.vitepress/locales/types'
import { localesConfig } from '../../.vitepress/config/locales'

export interface TranslationEntry {
  key: string
  translations: Record<string, string>
  path: string
  category: string
  isModified?: boolean
  originalTranslations?: Record<string, string>
  isDeleted?: boolean
}

// 扁平化嵌套对象为键值对
function flattenObject(obj: Record<string, string | number | boolean | object | null>, prefix: string = ''): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, string | number | boolean | object | null>, newKey))
    }
    else {
      result[newKey] = typeof value === 'string' ? value : JSON.stringify(value)
    }
  }

  return result
}

// 将扁平化的键值对重新构建为嵌套对象
function unflattenObject(flattened: Record<string, string>): Record<string, string | number | boolean | object> {
  const result: Record<string, string | number | boolean | object> = {}

  for (const [key, value] of Object.entries(flattened)) {
    const keys = key.split('.')
    let current = result

    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!current[k]) {
        current[k] = {}
      }
      current = current[k] as Record<string, string | number | boolean | object>
    }

    const lastKey = keys[keys.length - 1]
    try {
      const parsed = JSON.parse(value)
      current[lastKey] = typeof parsed === 'string' ? value : parsed
    }
    catch {
      current[lastKey] = value
    }
  }

  return result
}

export class TranslationService {
  private translationEntries: TranslationEntry[] = []
  private availableLocales: string[] = []
  private readonly STORAGE_KEY = 'translation_modifications'
  private readonly DELETED_STORAGE_KEY = 'translation_deleted'

  // 需要排除的非翻译字段（图片路径、URL、配置项等）
  private readonly excludedFields = new Set([
    'logo',
    'image',
    'icon',
    'link',
    'url',
    'href',
  ])

  async initialize(): Promise<void> {
    this.loadTranslations()
    this.applyStoredModifications()
  }

  private getStoredModifications(): Record<string, Record<string, string>> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    }
    catch {
      return {}
    }
  }

  private getStoredDeletedEntries(): Set<string> {
    try {
      const stored = localStorage.getItem(this.DELETED_STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    catch {
      return new Set()
    }
  }

  private saveDeletedStateToStorage(path: string, isDeleted: boolean): void {
    try {
      const deletedEntries = this.getStoredDeletedEntries()
      isDeleted ? deletedEntries.add(path) : deletedEntries.delete(path)
      localStorage.setItem(this.DELETED_STORAGE_KEY, JSON.stringify([...deletedEntries]))
    }
    catch {}
  }

  private saveModificationToStorage(path: string, locale: string, value: string): void {
    try {
      const modifications = this.getStoredModifications()
      if (!modifications[path])
        modifications[path] = {}
      modifications[path][locale] = value
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(modifications))
    }
    catch {}
  }

  private applyStoredModifications(): void {
    const modifications = this.getStoredModifications()
    const deletedEntries = this.getStoredDeletedEntries()

    for (const [path, localeValues] of Object.entries(modifications)) {
      const entry = this.translationEntries.find(e => e.path === path)
      if (entry) {
        for (const [locale, value] of Object.entries(localeValues)) {
          if (this.availableLocales.includes(locale)) {
            entry.translations[locale] = value
          }
        }
        entry.isModified = this.availableLocales.some(locale =>
          entry.translations[locale] !== entry.originalTranslations?.[locale],
        )
      }
    }

    for (const path of deletedEntries) {
      const entry = this.translationEntries.find(e => e.path === path)
      if (entry)
        entry.isDeleted = true
    }
  }

  private loadTranslations(): void {
    this.translationEntries = []
    this.availableLocales = Object.keys(localesConfig).map(key => key === 'root' ? 'zh' : key)

    const allKeys = new Set<string>()
    const localeData: Record<string, Record<string, Record<string, string>>> = {}

    this.availableLocales.forEach(locale => localeData[locale] = {})

    Object.entries(localesConfig).forEach(([configKey, config]) => {
      const locale = configKey === 'root' ? 'zh' : configKey
      const themeConfig = (config as LocaleSpecificConfig<CustomConfig & DefaultTheme.Config>).themeConfig
      if (!themeConfig)
        return

      const configFields = (Object.keys(themeConfig) as Array<keyof (CustomConfig & DefaultTheme.Config)>)
        .filter((field) => {
          const fieldValue = themeConfig[field]
          return fieldValue !== null && typeof fieldValue === 'object' && !this.excludedFields.has(field)
        })

      configFields.forEach((category) => {
        const fieldValue = themeConfig[category]
        if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
          const flattened = flattenObject(fieldValue as Record<string, string | number | boolean | object | null>)
          localeData[locale][category] = flattened
          Object.keys(flattened).forEach(key => allKeys.add(`${category}.${key}`))
        }
      })
    })

    for (const fullKey of allKeys) {
      const [category, ...keyParts] = fullKey.split('.')
      const key = keyParts.join('.')
      const translations: Record<string, string> = {}

      this.availableLocales.forEach((locale) => {
        translations[locale] = localeData[locale][category]?.[key] || ''
      })

      this.translationEntries.push({
        key,
        path: fullKey,
        category,
        translations,
        isModified: false,
        originalTranslations: { ...translations },
        isDeleted: false,
      })
    }

    this.translationEntries.sort((a, b) =>
      a.category !== b.category ? a.category.localeCompare(b.category) : a.key.localeCompare(b.key),
    )
  }

  getAvailableLocales(): string[] {
    return this.availableLocales
  }

  getTranslationEntries(): TranslationEntry[] {
    return this.translationEntries
  }

  searchTranslations(query: string): TranslationEntry[] {
    if (!query.trim()) {
      return this.translationEntries
    }

    const lowerQuery = query.toLowerCase()
    return this.translationEntries.filter((entry) => {
      return (
        entry.key.toLowerCase().includes(lowerQuery)
        || entry.category.toLowerCase().includes(lowerQuery)
        || Object.values(entry.translations).some(text =>
          text.toLowerCase().includes(lowerQuery),
        )
      )
    })
  }

  filterByCategory(category: string): TranslationEntry[] {
    if (!category || category === 'all') {
      return this.translationEntries
    }
    return this.translationEntries.filter(entry => entry.category === category)
  }

  getCategories(): string[] {
    const categories = new Set(this.translationEntries.map(entry => entry.category))
    return ['all', ...Array.from(categories).sort()]
  }

  updateTranslation(path: string, locale: string, value: string): void {
    const entry = this.translationEntries.find(e => e.path === path)
    if (entry && this.availableLocales.includes(locale)) {
      entry.translations[locale] = value
      this.saveModificationToStorage(path, locale, value)
      entry.isModified = this.availableLocales.some(loc =>
        entry.translations[loc] !== entry.originalTranslations?.[loc],
      )
    }
  }

  markEntryAsModified(entry: TranslationEntry): void {
    this.availableLocales.forEach((locale) => {
      if (entry.translations[locale] !== entry.originalTranslations?.[locale]) {
        this.saveModificationToStorage(entry.path, locale, entry.translations[locale])
      }
    })
    entry.isModified = this.availableLocales.some(locale =>
      entry.translations[locale] !== entry.originalTranslations?.[locale],
    )
  }

  deleteEntry(path: string): void {
    const entry = this.translationEntries.find(e => e.path === path)
    if (entry) {
      entry.isDeleted = true
      this.saveDeletedStateToStorage(path, true)
    }
  }

  restoreEntry(path: string): void {
    const entry = this.translationEntries.find(e => e.path === path)
    if (entry) {
      entry.isDeleted = false
      this.saveDeletedStateToStorage(path, false)
    }
  }

  getModifiedEntriesCount(): number {
    return this.translationEntries.filter(entry => entry.isModified).length
  }

  clearStoredModifications(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      this.loadTranslations()
    }
    catch {}
  }

  exportLocaleFile(locale: string, category: string): string {
    if (!this.availableLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`)
    }

    const entries = this.translationEntries.filter(entry =>
      entry.category === category && !entry.isDeleted,
    )
    const flattened: Record<string, string> = {}

    entries.forEach((entry) => {
      flattened[entry.key] = entry.translations[locale] || ''
    })

    return JSON.stringify(unflattenObject(flattened), null, 2)
  }

  exportAllCategories(locale: string): Record<string, string> {
    if (!this.availableLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`)
    }

    const result: Record<string, string> = {}
    this.getCategories().filter(cat => cat !== 'all').forEach((category) => {
      result[category] = this.exportLocaleFile(locale, category)
    })

    return result
  }

  getLocaleCode(locale: string): string {
    for (const [configKey] of Object.entries(localesConfig)) {
      const mappedLocale = configKey === 'root' ? 'zh' : configKey
      if (mappedLocale === locale) {
        return configKey === 'root' ? 'zh' : configKey
      }
    }
    return locale
  }
}

export const translationService = new TranslationService()
