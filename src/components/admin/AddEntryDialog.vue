<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { jsonTranslationService } from '~/services/jsonTranslationService'
import KeyTreeView from './KeyTreeView.vue'

interface Props {
  open: boolean
  availableLocales: string[]
  categories: string[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'entry-added'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 表单状态
const formData = ref({
  category: '',
  key: '',
  dataType: 'text' as 'text' | 'array' | 'regex',
})

// 翻译内容
const translations = ref<Record<string, string>>({})

// 键名相关 - 移除不再需要的newKey和isCreatingNewKey

// 特殊数据类型的解析内容（用于复杂编辑器）
const parsedTranslations = ref<Record<string, any>>({})

// 数组字段配置
const arrayFieldConfig = ref({
  fields: [
    { name: 'label', displayName: 'Label', placeholder: '显示文本' },
    { name: 'value', displayName: 'Value', placeholder: '值' },
    { name: 'key', displayName: 'Key', placeholder: '键名' },
  ],
})

// 新分类输入
const newCategory = ref('')
const isCreatingNewCategory = ref(false)

// 当前编辑的语言
const editingLocale = ref('zh')

// 计算可用分类（排除 'all'）
const availableCategories = computed(() =>
  props.categories.filter(cat => cat !== 'all'),
)

// KeyTreeView的TreeNode接口
interface TreeNode {
  name: string
  fullPath: string
  children: TreeNode[]
  isLeaf: boolean
}

// 构建键名树状结构
function buildKeyTree(keyPaths: string[]): TreeNode[] {
  const tree: any = {}

  keyPaths.forEach((path) => {
    const parts = path.split('.')
    let current = tree

    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          fullPath: parts.slice(0, index + 1).join('.'),
          name: part,
          children: {},
          isLeaf: index === parts.length - 1,
        }
      }
      current = current[part].children
    })
  })

  // 转换为TreeNode数组格式
  function treeToArray(obj: any): TreeNode[] {
    return Object.values(obj).map((item: any) => ({
      name: item.name,
      fullPath: item.fullPath,
      isLeaf: Object.keys(item.children).length === 0,
      children: Object.keys(item.children).length > 0 ? treeToArray(item.children) : [],
    }))
  }

  return treeToArray(tree)
}

// 计算可用键名树状结构（基于选中的分类）
const availableKeysTree = computed(() => {
  const currentCategory = isCreatingNewCategory.value ? newCategory.value : formData.value.category
  if (!currentCategory)
    return []

  const entriesInCategory = jsonTranslationService.getTranslationEntries()
    .filter(entry => entry.category === currentCategory)

  // 构建树状结构
  const keyPaths = entriesInCategory.map(entry => entry.key)
  return buildKeyTree(keyPaths)
})

// 处理树选择
function handleKeySelect(selectedPath: string) {
  formData.value.key = selectedPath
}

// 移除不再需要的availableKeysList，因为现在直接通过路径输入

// 监听对话框打开状态，重置表单
watch(() => props.open, (isOpen) => {
  if (isOpen) {
    resetForm()
    // 强制初始化默认数据类型的解析内容
    setTimeout(() => {
      props.availableLocales.forEach((locale) => {
        if (formData.value.dataType === 'text') {
          parsedTranslations.value[locale] = null
        }
        else if (formData.value.dataType === 'array') {
          // 使用当前字段配置生成初始内容
          const sampleItems = []
          for (let i = 0; i < 2; i++) {
            const item: any = {}
            arrayFieldConfig.value.fields.forEach((field, index) => {
              if (field.name === 'label') {
                item[field.name] = `选项${i + 1}`
              }
              else if (field.name === 'value') {
                item[field.name] = `OPTION_${i + 1}`
              }
              else if (field.name === 'key') {
                item[field.name] = `option${i + 1}`
              }
              else {
                item[field.name] = `示例${index + 1}-${i + 1}`
              }
            })
            sampleItems.push(item)
          }
          parsedTranslations.value[locale] = sampleItems
        }
      })
    }, 0)
  }
})

function resetForm() {
  formData.value = {
    category: '',
    key: '',
    dataType: 'text',
  }
  translations.value = {}
  parsedTranslations.value = {}
  newCategory.value = ''
  isCreatingNewCategory.value = false

  // 初始化翻译字段
  props.availableLocales.forEach((locale) => {
    translations.value[locale] = generatePresetValue('text', locale)
    parsedTranslations.value[locale] = null
  })
}

function toggleNewCategory() {
  isCreatingNewCategory.value = !isCreatingNewCategory.value
  if (isCreatingNewCategory.value) {
    formData.value.category = ''
  }
}

// 验证表单
const isFormValid = computed(() => {
  const category = isCreatingNewCategory.value ? newCategory.value : formData.value.category
  const key = formData.value.key

  if (!category || !key)
    return false

  // 检查是否有重复路径
  const path = `${category}.${key}`
  const existingEntry = jsonTranslationService.getTranslationEntries().find(e => e.path === path)

  return !existingEntry
})

// 检查是否有重复条目
const duplicateWarning = computed(() => {
  const category = isCreatingNewCategory.value ? newCategory.value : formData.value.category
  const key = formData.value.key

  if (!category || !key)
    return ''

  const path = `${category}.${key}`
  const existingEntry = jsonTranslationService.getTranslationEntries().find(e => e.path === path)

  return existingEntry ? `条目 "${path}" 已存在` : ''
})

// JSON数据预览
const jsonPreview = computed(() => {
  const category = isCreatingNewCategory.value ? newCategory.value : formData.value.category
  const key = formData.value.key

  if (!category || !key)
    return ''

  const preview: any = {}
  props.availableLocales.forEach((locale) => {
    const translationValue = translations.value[locale]
    if (translationValue) {
      try {
        // 尝试解析JSON，如果失败则作为字符串处理
        if (formData.value.dataType === 'text') {
          preview[locale] = translationValue
        }
        else {
          preview[locale] = JSON.parse(translationValue)
        }
      }
      catch {
        preview[locale] = translationValue
      }
    }
  })

  return JSON.stringify(preview, null, 2)
})

// 生成预设值根据数据类型
function generatePresetValue(dataType: string, locale: string): string {
  switch (dataType) {
    case 'array':
      // 使用当前字段配置生成示例数据
      const sampleItems = []
      for (let i = 0; i < 2; i++) {
        const item: any = {}
        arrayFieldConfig.value.fields.forEach((field, index) => {
          if (field.name === 'label') {
            item[field.name] = `选项${i + 1}`
          }
          else if (field.name === 'value') {
            item[field.name] = `OPTION_${i + 1}`
          }
          else if (field.name === 'key') {
            item[field.name] = `option${i + 1}`
          }
          else {
            item[field.name] = `示例${index + 1}-${i + 1}`
          }
        })
        sampleItems.push(item)
      }
      return JSON.stringify(sampleItems, null, 2)
    case 'regex':
      return JSON.stringify({
        __regex__: '.*',
        __flags__: 'i',
      }, null, 2)
    default:
      return locale === 'zh' ? '示例文本' : locale === 'en' ? 'Sample text' : 'サンプルテキスト'
  }
}

// 当数据类型改变时，更新预设值
watch(() => formData.value.dataType, (newType) => {
  props.availableLocales.forEach((locale) => {
    const presetValue = generatePresetValue(newType, locale)
    translations.value[locale] = presetValue

    // 同时更新解析后的内容
    if (newType === 'regex') {
      parsedTranslations.value[locale] = { __regex__: '.*', __flags__: 'i' }
    }
    else if (newType === 'array') {
      // 使用当前字段配置生成解析后的内容
      const sampleItems = []
      for (let i = 0; i < 2; i++) {
        const item: any = {}
        arrayFieldConfig.value.fields.forEach((field, index) => {
          if (field.name === 'label') {
            item[field.name] = `选项${i + 1}`
          }
          else if (field.name === 'value') {
            item[field.name] = `OPTION_${i + 1}`
          }
          else if (field.name === 'key') {
            item[field.name] = `option${i + 1}`
          }
          else {
            item[field.name] = `示例${index + 1}-${i + 1}`
          }
        })
        sampleItems.push(item)
      }
      parsedTranslations.value[locale] = sampleItems
    }
    else {
      parsedTranslations.value[locale] = null
    }
  })
})

// 监听字段配置变化，自动更新现有数组项结构
watch(() => arrayFieldConfig.value.fields, (newFields) => {
  if (formData.value.dataType === 'array') {
    Object.keys(parsedTranslations.value).forEach((locale) => {
      if (Array.isArray(parsedTranslations.value[locale])) {
        parsedTranslations.value[locale].forEach((item: any) => {
          // 添加新字段
          newFields.forEach((field) => {
            if (!(field.name in item)) {
              item[field.name] = ''
            }
          })

          // 移除不存在的字段
          const validFieldNames = newFields.map(f => f.name)
          Object.keys(item).forEach((key) => {
            if (!validFieldNames.includes(key)) {
              delete item[key]
            }
          })
        })
        syncParsedToString(locale)
      }
    })
  }
}, { deep: true })

// 解析特殊数据类型
function parseSpecialValue(value: string, dataType: string): any {
  if (dataType === 'text')
    return value

  try {
    return JSON.parse(value)
  }
  catch {
    if (dataType === 'array') {
      // 使用当前字段配置生成默认项
      const defaultItem: any = {}
      arrayFieldConfig.value.fields.forEach((field) => {
        defaultItem[field.name] = ''
      })
      return [defaultItem]
    }
    else {
      return { __regex__: '', __flags__: '' }
    }
  }
}

// 序列化特殊数据类型
function stringifySpecialValue(value: any, dataType: string): string {
  if (dataType === 'text')
    return String(value)
  return JSON.stringify(value, null, 2)
}

// 同步解析内容到字符串
function syncParsedToString(locale: string) {
  if (formData.value.dataType !== 'text') {
    translations.value[locale] = stringifySpecialValue(parsedTranslations.value[locale], formData.value.dataType)
  }
}

function handleSubmit() {
  if (!isFormValid.value) {
    toast.error('请检查表单输入')
    return
  }

  const category = isCreatingNewCategory.value ? newCategory.value : formData.value.category
  const key = formData.value.key
  const path = `${category}.${key}`

  try {
    // 构造新条目
    const newEntry: TranslationEntry = {
      key,
      path,
      category,
      translations: { ...translations.value },
      isModified: true,
      originalTranslations: {},
      isDeleted: false,
    }

    // 将条目添加到服务中
    jsonTranslationService.getTranslationEntries().push(newEntry)

    // 标记为已修改
    jsonTranslationService.markEntryAsModified(newEntry)

    toast.success('条目添加成功')
    emit('entry-added')
    emit('update:open', false)
  }
  catch (error) {
    console.error('添加条目失败:', error)
    toast.error('添加条目失败')
  }
}

function handleCancel() {
  emit('update:open', false)
}

// 更新正则表达式字段
function updateRegexField(locale: string, field: 'pattern' | 'flags', value: string) {
  if (!parsedTranslations.value[locale]) {
    parsedTranslations.value[locale] = { __regex__: '', __flags__: '' }
  }

  if (field === 'pattern') {
    parsedTranslations.value[locale].__regex__ = value
  }
  else {
    parsedTranslations.value[locale].__flags__ = value
  }

  syncParsedToString(locale)
}

// 切换正则表达式标志
function toggleRegexFlag(locale: string, flag: string, enabled: boolean) {
  if (!parsedTranslations.value[locale]) {
    parsedTranslations.value[locale] = { __regex__: '', __flags__: '' }
  }

  let flags = parsedTranslations.value[locale].__flags__ || ''

  if (enabled) {
    if (!flags.includes(flag)) {
      flags += flag
    }
  }
  else {
    flags = flags.replace(flag, '')
  }

  parsedTranslations.value[locale].__flags__ = flags
  syncParsedToString(locale)
}

// 添加数组项
function addArrayItem(locale: string) {
  if (!parsedTranslations.value[locale]) {
    parsedTranslations.value[locale] = []
  }

  const newItem: any = {}
  arrayFieldConfig.value.fields.forEach((field) => {
    newItem[field.name] = ''
  })

  parsedTranslations.value[locale].push(newItem)
  syncParsedToString(locale)
}

// 移除数组项
function removeArrayItem(locale: string, index: number) {
  if (parsedTranslations.value[locale] && Array.isArray(parsedTranslations.value[locale])) {
    parsedTranslations.value[locale].splice(index, 1)
    syncParsedToString(locale)
  }
}

// 更新数组项
function updateArrayItem(locale: string, index: number, fieldName: string, value: string) {
  if (parsedTranslations.value[locale] && parsedTranslations.value[locale][index]) {
    parsedTranslations.value[locale][index][fieldName] = value
    syncParsedToString(locale)
  }
}

// 移动数组项
function moveArrayItem(locale: string, index: number, direction: number) {
  const array = parsedTranslations.value[locale]
  if (!Array.isArray(array))
    return

  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= array.length)
    return

  // 交换位置
  const temp = array[index]
  array[index] = array[newIndex]
  array[newIndex] = temp

  syncParsedToString(locale)
}

// 语言显示名称
function getLocaleDisplayName(locale: string): string {
  const localeNames: Record<string, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
  }
  return localeNames[locale] || locale
}

// 数组字段管理
function addArrayField() {
  arrayFieldConfig.value.fields.push({
    name: `field${arrayFieldConfig.value.fields.length + 1}`,
    displayName: `字段${arrayFieldConfig.value.fields.length + 1}`,
    placeholder: '自定义字段',
  })
}

function removeArrayField(index: number) {
  if (arrayFieldConfig.value.fields.length > 1) {
    const fieldToRemove = arrayFieldConfig.value.fields[index]
    arrayFieldConfig.value.fields.splice(index, 1)

    // 更新现有数组项，移除对应字段
    Object.keys(parsedTranslations.value).forEach((locale) => {
      if (Array.isArray(parsedTranslations.value[locale])) {
        parsedTranslations.value[locale].forEach((item: any) => {
          if (fieldToRemove?.name && item[fieldToRemove.name] !== undefined) {
            delete item[fieldToRemove.name]
          }
        })
        syncParsedToString(locale)
      }
    })
  }
}

function updateArrayFieldConfig(index: number, field: 'name' | 'displayName' | 'placeholder', value: string) {
  const oldName = arrayFieldConfig.value.fields[index].name
  arrayFieldConfig.value.fields[index][field] = value

  // 如果修改的是字段名，需要更新所有数组项中的对应字段
  if (field === 'name' && oldName !== value) {
    Object.keys(parsedTranslations.value).forEach((locale) => {
      if (Array.isArray(parsedTranslations.value[locale])) {
        parsedTranslations.value[locale].forEach((item: any) => {
          if (item[oldName] !== undefined) {
            item[value] = item[oldName]
            delete item[oldName]
          }
        })
        syncParsedToString(locale)
      }
    })
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[90vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>添加翻译条目</DialogTitle>
        <DialogDescription>
          创建新的翻译条目，支持文本、数组和正则表达式类型
        </DialogDescription>
        <div class="text-xs text-muted-foreground">
          调试: Dialog Open = {{ open }}
        </div>
      </DialogHeader>

      <div class="py-4 space-y-6">
        <!-- 分类选择 -->
        <div class="space-y-2">
          <Label for="category">分类</Label>
          <div class="flex gap-2">
            <Select
              v-if="!isCreatingNewCategory"
              v-model="formData.category"
              :disabled="isCreatingNewCategory"
              class="flex-1"
            >
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="category in availableCategories"
                  :key="category"
                  :value="category"
                >
                  {{ category }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Input
              v-else
              v-model="newCategory"
              placeholder="输入新分类名称"
              class="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              @click="toggleNewCategory"
            >
              {{ isCreatingNewCategory ? '选择现有' : '新建分类' }}
            </Button>
          </div>
        </div>

        <!-- 键名树状结构 -->
        <div v-if="formData.category || newCategory" class="space-y-2">
          <Label>现有键名结构</Label>
          <div v-if="availableKeysTree.length > 0" class="max-h-[200px] overflow-auto border rounded p-3">
            <KeyTreeView
              :tree="availableKeysTree"
              :selected="formData.key"
              @select="handleKeySelect"
            />
          </div>
          <div v-else class="border rounded p-3 text-center text-muted-foreground">
            <i class="i-lucide-folder-open mx-auto mb-2 h-6 w-6 opacity-50" />
            <p class="text-sm">
              该分类下暂无现有键名
            </p>
            <p class="text-xs">
              请在下方路径预览中手动输入新键名
            </p>
          </div>
        </div>

        <!-- 数据类型选择 -->
        <div class="space-y-2">
          <Label>数据类型</Label>
          <div class="mb-2 text-xs text-muted-foreground">
            当前选择: {{ formData.dataType }}
          </div>
          <Tabs :model-value="formData.dataType" class="w-full" @update:model-value="formData.dataType = $event">
            <TabsList class="grid grid-cols-3 w-full">
              <TabsTrigger value="text">
                普通文本
              </TabsTrigger>
              <TabsTrigger value="array">
                对象数组
              </TabsTrigger>
              <TabsTrigger value="regex">
                正则表达式
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" class="mt-4">
              <p class="text-sm text-muted-foreground">
                普通的文本内容，适用于标题、描述等
              </p>
            </TabsContent>

            <TabsContent value="array" class="mt-4">
              <p class="text-sm text-muted-foreground">
                对象数组，如选项列表、导航菜单等。字段结构可自定义配置，支持任意字段名和数量。
              </p>
            </TabsContent>

            <TabsContent value="regex" class="mt-4">
              <p class="text-sm text-muted-foreground">
                正则表达式对象。格式：{"__regex__": "表达式", "__flags__": "标志"}
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <!-- 项目路径编辑 -->
        <div v-if="formData.category || newCategory" class="space-y-2">
          <Label>项目路径</Label>
          <Input
            v-model="formData.key"
            placeholder="输入完整路径，如: ui.button.primary"
            class="font-mono"
          />
        </div>

        <!-- 重复警告 -->
        <div v-if="duplicateWarning" class="rounded bg-destructive/10 p-3 text-sm text-destructive">
          <i class="i-lucide-alert-triangle mr-2 inline h-4 w-4" />
          {{ duplicateWarning }}
        </div>

        <!-- 翻译内容 -->
        <div class="space-y-4">
          <Label>翻译内容</Label>

          <!-- 语言切换标签页 -->
          <div class="flex gap-2 border-b">
            <Button
              v-for="locale in availableLocales"
              :key="locale"
              variant="ghost"
              size="sm"
              class="border-b-2 border-transparent rounded-none data-[active=true]:border-primary"
              :data-active="editingLocale === locale"
              @click="editingLocale = locale"
            >
              {{ getLocaleDisplayName(locale) }}
            </Button>
          </div>

          <!-- 当前语言的编辑器 -->
          <div class="space-y-4">
            <!-- 普通文本 -->
            <div v-if="formData.dataType === 'text'" class="space-y-2">
              <Label>{{ getLocaleDisplayName(editingLocale) }}</Label>
              <Input
                v-model="translations[editingLocale]"
                :placeholder="generatePresetValue(formData.dataType, editingLocale)"
              />
            </div>

            <!-- 正则表达式编辑器 -->
            <div v-else-if="formData.dataType === 'regex'" class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>正则表达式模式</Label>
                  <Input
                    :model-value="parsedTranslations[editingLocale]?.__regex__ || ''"
                    placeholder="例如: ^[a-z]+$"
                    class="font-mono"
                    @update:model-value="updateRegexField(editingLocale, 'pattern', $event)"
                  />
                </div>
                <div class="space-y-2">
                  <Label>标志 (可选)</Label>
                  <Input
                    :model-value="parsedTranslations[editingLocale]?.__flags__ || ''"
                    placeholder="例如: i, g, m"
                    @update:model-value="updateRegexField(editingLocale, 'flags', $event)"
                  />
                </div>
              </div>
            </div>

            <!-- 对象数组编辑器 -->
            <div v-else-if="formData.dataType === 'array'" class="space-y-4">
              <!-- 字段配置 -->
              <div class="border rounded p-3 space-y-3">
                <div class="flex items-center justify-between">
                  <Label class="text-sm font-medium">字段配置</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    @click="addArrayField"
                  >
                    <i class="i-lucide-plus mr-1 h-3 w-3" />
                    添加字段
                  </Button>
                </div>

                <div
                  v-for="(field, index) in arrayFieldConfig.fields"
                  :key="index"
                  class="grid grid-cols-4 items-end gap-2"
                >
                  <div class="space-y-1">
                    <Label class="text-xs">字段名</Label>
                    <Input
                      :model-value="field.name"
                      class="text-xs font-mono"
                      @update:model-value="updateArrayFieldConfig(index, 'name', $event)"
                    />
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs">显示名</Label>
                    <Input
                      :model-value="field.displayName"
                      class="text-xs"
                      @update:model-value="updateArrayFieldConfig(index, 'displayName', $event)"
                    />
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs">占位符</Label>
                    <Input
                      :model-value="field.placeholder"
                      class="text-xs"
                      @update:model-value="updateArrayFieldConfig(index, 'placeholder', $event)"
                    />
                  </div>
                  <Button
                    v-if="arrayFieldConfig.fields.length > 1"
                    size="sm"
                    variant="ghost"
                    @click="removeArrayField(index)"
                  >
                    <i class="i-lucide-trash-2 h-3 w-3" />
                  </Button>
                </div>
              </div>

              <!-- 数组项目 -->
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium">数组项目</Label>
                <Button
                  size="sm"
                  variant="outline"
                  @click="addArrayItem(editingLocale)"
                >
                  <i class="i-lucide-plus mr-1 h-3 w-3" />
                  添加项目
                </Button>
              </div>

              <div
                v-for="(arrayItem, index) in parsedTranslations[editingLocale] || []"
                :key="index"
                class="border rounded-lg p-4 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground font-medium">项目 #{{ index + 1 }}</span>
                  <div class="flex items-center gap-2">
                    <Button
                      v-if="index > 0"
                      size="sm"
                      variant="ghost"
                      title="上移"
                      @click="moveArrayItem(editingLocale, index, -1)"
                    >
                      <i class="i-lucide-chevron-up h-3 w-3" />
                    </Button>
                    <Button
                      v-if="index < (parsedTranslations[editingLocale] || []).length - 1"
                      size="sm"
                      variant="ghost"
                      title="下移"
                      @click="moveArrayItem(editingLocale, index, 1)"
                    >
                      <i class="i-lucide-chevron-down h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      @click="removeArrayItem(editingLocale, index)"
                    >
                      <i class="i-lucide-trash-2 h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div class="grid gap-3" :style="{ gridTemplateColumns: `repeat(${arrayFieldConfig.fields.length}, 1fr)` }">
                  <div
                    v-for="field in arrayFieldConfig.fields"
                    :key="field.name"
                    class="space-y-1"
                  >
                    <Label class="text-xs">{{ field.displayName }}</Label>
                    <Input
                      :model-value="arrayItem[field.name] || ''"
                      :placeholder="field.placeholder"
                      class="bg-background text-xs font-mono focus:bg-background hover:bg-background"
                      @update:model-value="updateArrayItem(editingLocale, index, field.name, $event)"
                    />
                  </div>
                </div>
              </div>

              <div v-if="!(parsedTranslations[editingLocale] || []).length" class="py-4 text-center text-muted-foreground">
                暂无数组项，点击上方"添加项目"按钮开始添加
              </div>
            </div>
          </div>
        </div>

        <!-- JSON数据预览 -->
        <div v-if="jsonPreview" class="space-y-2">
          <Label>JSON数据预览</Label>
          <div class="max-h-[200px] overflow-auto border rounded bg-muted/30 p-3">
            <pre class="whitespace-pre-wrap text-xs font-mono">{{ jsonPreview }}</pre>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          <i class="i-lucide-plus mr-2 h-4 w-4" />
          添加条目
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
