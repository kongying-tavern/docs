import type { ChangeType } from '~/constants/translationConstants'
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { EXPORT_CONFIG, LOCALE_DISPLAY_NAMES } from '~/constants/translationConstants'
import { jsonTranslationService } from '~/services/jsonTranslationService'

interface UseTranslationExportParams {
  translationEntries: () => TranslationEntry[]
  availableLocales: () => string[]
  categories: () => string[]
}

interface ExportChange {
  type: ChangeType
  key: string
  oldValue?: string
  newValue?: string
}

interface ExportPreviewItem {
  locale: string
  category: string
  changes: ExportChange[]
}

export function useTranslationExport({
  translationEntries,
  availableLocales,
  categories,
}: UseTranslationExportParams) {
  // 导出预览状态
  const exportPreviewOpen = ref(false)
  const previewData = ref<ExportPreviewItem[]>([])

  // 检测有变更的语言
  const changedLocales = computed(() => {
    const localesWithChanges = new Set<string>()

    translationEntries().forEach((entry) => {
      if (entry.isModified || entry.isDeleted) {
        availableLocales().forEach((locale) => {
          if (entry.translations[locale]) {
            localesWithChanges.add(locale)
          }
        })
      }
    })

    return Array.from(localesWithChanges)
  })

  // 是否有变更
  const hasChanges = computed(() => changedLocales.value.length > 0)

  // 生成预览数据
  function generatePreviewData() {
    const preview: ExportPreviewItem[] = []

    changedLocales.value.forEach((locale) => {
      categories().forEach((category) => {
        if (category === 'all')
          return

        // 收集该语言该分类下的变更
        const changes: ExportChange[] = []

        translationEntries().forEach((entry) => {
          if (entry.category === category && entry.translations[locale]) {
            if (entry.isModified) {
              changes.push({
                type: 'modified',
                key: entry.key,
                oldValue: entry.originalTranslations?.[locale] || '',
                newValue: entry.translations[locale],
              })
            }
            else if (entry.isDeleted) {
              changes.push({
                type: 'deleted',
                key: entry.key,
                oldValue: entry.originalTranslations?.[locale] || entry.translations[locale],
                newValue: '',
              })
            }
          }
        })

        if (changes.length > 0) {
          preview.push({
            locale,
            category,
            changes,
          })
        }
      })
    })

    previewData.value = preview
  }

  // 文件下载功能
  function downloadFile(filename: string, content: string) {
    const blob = new Blob([content], { type: EXPORT_CONFIG.FILE_TYPE })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 构建完整的语言翻译对象
  function buildLanguageTranslations(locale: string): Record<string, any> {
    const translations: Record<string, any> = {}

    translationEntries().forEach((entry) => {
      if (!entry.isDeleted && entry.translations[locale]) {
        // 构建嵌套路径
        const keys = `${entry.category}.${entry.key}`.split('.')
        let current = translations

        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {}
          }
          current = current[keys[i]]
        }

        // 设置最终值
        const finalKey = keys[keys.length - 1]
        let value = entry.translations[locale]

        // 处理特殊类型的值
        if (typeof value === 'string') {
          try {
            // 尝试解析数组或对象
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed) || typeof parsed === 'object') {
              value = parsed
            }
          }
          catch {
            // 如果不是有效的 JSON，保持字符串
          }
        }

        current[finalKey] = value
      }
    })

    return translations
  }

  // 确认导出
  function confirmExport() {
    let exportedCount = 0

    changedLocales.value.forEach((locale) => {
      // 检查该语言是否有任何条目
      const localeHasEntries = translationEntries().some(entry =>
        !entry.isDeleted // 不包括已删除的条目
        && entry.translations[locale], // 该语言有翻译内容
      )

      if (localeHasEntries) {
        try {
          const localeCode = jsonTranslationService.getLocaleCode(locale)
          const translations = buildLanguageTranslations(locale)

          // 导出完整的语言文件
          const content = JSON.stringify(translations, null, EXPORT_CONFIG.INDENT_SPACES)
          downloadFile(`${localeCode}.json`, content)
          exportedCount++
        }
        catch (error) {
          console.error(`导出 ${locale} 失败:`, error)
        }
      }
    })

    exportPreviewOpen.value = false

    if (exportedCount > 0) {
      toast.success(`已导出 ${exportedCount} 个语言翻译文件`)
    }
    else {
      toast.error('导出失败，请检查变更内容')
    }
  }

  // 智能导出（显示预览）
  function handleSmartExport() {
    if (!hasChanges.value) {
      toast.error('没有检测到变更')
      return
    }

    generatePreviewData()
    exportPreviewOpen.value = true
  }

  // 语言显示名称映射
  function getLocaleDisplayName(locale: string): string {
    return LOCALE_DISPLAY_NAMES[locale as keyof typeof LOCALE_DISPLAY_NAMES] || locale
  }

  // 关闭预览对话框
  function closeExportPreview() {
    exportPreviewOpen.value = false
  }

  return {
    // 状态
    exportPreviewOpen,
    previewData,

    // 计算属性
    changedLocales,
    hasChanges,

    // 方法
    handleSmartExport,
    confirmExport,
    closeExportPreview,
    getLocaleDisplayName,
    generatePreviewData,
    downloadFile,
    buildLanguageTranslations,
  }
}
