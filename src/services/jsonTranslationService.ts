export interface TranslationEntry {
  key: string
  path: string
  category: string
  translations: Record<string, string>
  isModified: boolean
  originalTranslations?: Record<string, string>
  isDeleted: boolean
}

class JSONTranslationService {
  private translationEntries: TranslationEntry[] = []
  private availableLocales: string[] = ['zh', 'en', 'ja']
  private isInitialized = false

  private readonly STORAGE_KEY = 'translation_modifications'
  private readonly DELETED_STORAGE_KEY = 'translation_deleted'

  async initialize(): Promise<void> {
    if (this.isInitialized)
      return

    // Skip initialization in SSR environment
    if (import.meta.env.SSR) {
      this.isInitialized = true
      return
    }

    await this.loadTranslationsFromJSON()
    this.applyStoredModifications()
    this.isInitialized = true
  }

  // 扁平化 JSON 对象，将嵌套结构转换为点分隔的键名
  private flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
    const flattened: Record<string, string> = {}

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (value === null || value === undefined) {
        flattened[newKey] = ''
      }
      else if (typeof value === 'object' && !Array.isArray(value) && !this.isSpecialObject(value)) {
        // 递归处理嵌套对象
        Object.assign(flattened, this.flattenObject(value as Record<string, unknown>, newKey))
      }
      else {
        // 叶子节点：字符串、数组、特殊对象等
        flattened[newKey] = typeof value === 'string' ? value : JSON.stringify(value)
      }
    }

    return flattened
  }

  // 检查是否为特殊对象（正则表达式、Date等）
  private isSpecialObject(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
      return false
    }

    // 检查正则表达式对象
    if ('__regex__' in value && '__flags__' in value) {
      return true
    }

    // 可以添加其他特殊对象的检查
    return false
  }

  // 从扁平化的数据重构嵌套对象
  private unflattenObject(flattened: Record<string, string>): Record<string, unknown> {
    const result: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(flattened)) {
      const keys = key.split('.')
      let current = result

      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {}
        }
        current = current[keys[i]] as Record<string, unknown>
      }

      const lastKey = keys[keys.length - 1]

      // 尝试解析 JSON 值
      try {
        const parsed = JSON.parse(value)
        current[lastKey] = parsed
      }
      catch {
        // 不是 JSON，直接使用字符串值
        current[lastKey] = value
      }
    }

    return result
  }

  private async loadTranslationsFromJSON(): Promise<void> {
    try {
      // 动态导入 JSON 文件
      const [zhData, enData, jaData] = await Promise.all([
        import('../../.vitepress/locales/json/zh.json'),
        import('../../.vitepress/locales/json/en.json'),
        import('../../.vitepress/locales/json/ja.json'),
      ])

      // 跳过 convertRegexObjects 转换，保持 {__regex__, __flags__} 格式
      // 这样可以在编辑器中正确处理正则表达式对象
      const localeData: Record<string, Record<string, unknown>> = {
        zh: zhData.default || zhData,
        en: enData.default || enData,
        ja: jaData.default || jaData,
      }

      // 扁平化每个语言的数据
      const flattenedData: Record<string, Record<string, string>> = {}
      for (const [locale, data] of Object.entries(localeData)) {
        flattenedData[locale] = this.flattenObject(data)
      }

      // 收集所有翻译键
      const allKeys = new Set<string>()
      Object.values(flattenedData).forEach((data) => {
        Object.keys(data).forEach(key => allKeys.add(key))
      })

      // 生成翻译条目
      this.translationEntries = Array.from(allKeys).map((key) => {
        const [category, ...keyParts] = key.split('.')
        const translations: Record<string, string> = {}

        this.availableLocales.forEach((locale) => {
          const value = flattenedData[locale]?.[key]
          translations[locale] = value || ''
        })

        return {
          key: keyParts.join('.') || category,
          path: key,
          category: category || 'root',
          translations,
          isModified: false,
          originalTranslations: { ...translations },
          isDeleted: false,
        }
      })

      // 按分类和键排序
      this.translationEntries.sort((a, b) =>
        a.category !== b.category ? a.category.localeCompare(b.category) : a.key.localeCompare(b.key),
      )
    }
    catch (error) {
      console.error('Failed to load JSON translations:', error)
      throw new Error('翻译文件加载失败')
    }
  }

  private getStoredModifications(): Record<string, Record<string, string>> {
    if (import.meta.env.SSR || typeof localStorage === 'undefined') {
      return {}
    }
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    }
    catch {
      return {}
    }
  }

  private getStoredDeletedEntries(): Set<string> {
    if (import.meta.env.SSR || typeof localStorage === 'undefined') {
      return new Set()
    }
    try {
      const stored = localStorage.getItem(this.DELETED_STORAGE_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    catch {
      return new Set()
    }
  }

  private saveDeletedStateToStorage(path: string, isDeleted: boolean): void {
    if (import.meta.env.SSR || typeof localStorage === 'undefined') {
      return
    }
    try {
      const deletedEntries = this.getStoredDeletedEntries()
      isDeleted ? deletedEntries.add(path) : deletedEntries.delete(path)
      localStorage.setItem(this.DELETED_STORAGE_KEY, JSON.stringify([...deletedEntries]))
    }
    catch {}
  }

  private saveModificationToStorage(path: string, locale: string, value: string): void {
    if (import.meta.env.SSR || typeof localStorage === 'undefined') {
      return
    }
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

    // 应用修改的翻译（本地数据优先策略）
    for (const [path, localeValues] of Object.entries(modifications)) {
      const entry = this.translationEntries.find(e => e.path === path)
      if (entry) {
        for (const [locale, value] of Object.entries(localeValues)) {
          if (this.availableLocales.includes(locale)) {
            // 冲突处理：本地修改优先，直接覆盖原始数据
            entry.translations[locale] = value
          }
        }
        entry.isModified = this.availableLocales.some(locale =>
          entry.translations[locale] !== entry.originalTranslations?.[locale],
        )
      }
    }

    // 应用删除状态（本地删除状态优先）
    for (const path of deletedEntries) {
      const entry = this.translationEntries.find(e => e.path === path)
      if (entry) {
        entry.isDeleted = true
      }
    }
  }

  // 检查是否有本地修改
  hasLocalModifications(): boolean {
    const modifications = this.getStoredModifications()
    const deletedEntries = this.getStoredDeletedEntries()
    return Object.keys(modifications).length > 0 || deletedEntries.size > 0
  }

  // 获取本地修改的摘要信息
  getLocalModificationsSummary(): { modified: number, deleted: number, total: number } {
    const modifications = this.getStoredModifications()
    const deletedEntries = this.getStoredDeletedEntries()

    const modifiedCount = Object.keys(modifications).length
    const deletedCount = deletedEntries.size

    return {
      modified: modifiedCount,
      deleted: deletedCount,
      total: modifiedCount + deletedCount,
    }
  }

  getTranslationEntries(): TranslationEntry[] {
    return this.translationEntries
  }

  getAvailableLocales(): string[] {
    return this.availableLocales
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
    if (import.meta.env.SSR || typeof localStorage === 'undefined') {
      return
    }
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      localStorage.removeItem(this.DELETED_STORAGE_KEY)
      this.loadTranslationsFromJSON()
    }
    catch {}
  }

  clearStoredDeletedEntries(): void {
    if (import.meta.env.SSR || typeof localStorage === 'undefined') {
      return
    }
    try {
      localStorage.removeItem(this.DELETED_STORAGE_KEY)
      // 重新加载数据以恢复已删除的条目
      this.loadTranslationsFromJSON()
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

    // 构建扁平化数据
    const flattenedData: Record<string, string> = {}
    entries.forEach((entry) => {
      const value = entry.translations[locale] || ''
      flattenedData[entry.path] = value
    })

    // 重新构建嵌套结构
    const nestedResult = this.unflattenObject(flattenedData)

    return JSON.stringify(nestedResult, null, 2)
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
    return locale
  }

  filterByCategory(category: string): TranslationEntry[] {
    if (category === 'all')
      return this.translationEntries
    return this.translationEntries.filter(entry => entry.category === category)
  }

  searchTranslations(query: string): TranslationEntry[] {
    if (!query.trim())
      return this.translationEntries

    const searchTerm = query.toLowerCase()
    return this.translationEntries.filter((entry) => {
      // 搜索键名
      if (entry.key.toLowerCase().includes(searchTerm))
        return true
      if (entry.path.toLowerCase().includes(searchTerm))
        return true

      // 搜索翻译内容
      return this.availableLocales.some(locale =>
        entry.translations[locale]?.toLowerCase().includes(searchTerm),
      )
    })
  }
}

export const jsonTranslationService = new JSONTranslationService()
