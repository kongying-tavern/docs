<!-- eslint-disable regexp/no-super-linear-backtracking -->
<script setup lang="ts">
import type { FieldMetadata } from '~/services/enhancedTranslationService'
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { enhancedTranslationService } from '~/services/enhancedTranslationService'
import { localesConfig } from '../../../.vitepress/config/locales'

interface Props {
  entry: TranslationEntry | null
  open: boolean
  availableLocales: string[]
}

interface Emits {
  (e: 'update:open', open: boolean): void
  (e: 'save', entry: TranslationEntry): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const editingLocale = ref('zh')

// 解析后的字段数据
const parsedFields = ref<Record<string, Record<string, string>>>({})
const localTranslations = ref<Record<string, string>>({})

// 安全的字段访问器
function getFieldValue(locale: string, field: string): string {
  return parsedFields.value[locale]?.[field] || ''
}

function setFieldValue(locale: string, field: string, value: string) {
  if (!parsedFields.value[locale]) {
    parsedFields.value[locale] = {}
  }
  parsedFields.value[locale][field] = value
}

// 获取字段元数据
function getFieldMetadata(entry: TranslationEntry): FieldMetadata {
  return enhancedTranslationService.analyzeField(entry.path, entry.translations.zh)
}

// 解析 JSON 字段为具体的输入项
function parseJsonFields(value: string, type: FieldMetadata['type']) {
  try {
    const parsed = JSON.parse(value)

    if (type === 'regex' && typeof parsed === 'object' && parsed.__regex__) {
      return {
        pattern: parsed.__regex__,
        flags: parsed.__flags__ || '',
      }
    }

    if (type === 'meta' && Array.isArray(parsed)) {
      // Handle single meta tag: ["meta", {...}]
      if (parsed.length >= 2 && parsed[0] === 'meta') {
        const [tag, attrs] = parsed
        return {
          tag,
          property: attrs?.property || '',
          content: attrs?.content || '',
          name: attrs?.name || '',
          httpEquiv: attrs?.['http-equiv'] || '',
        }
      }

      // Handle head array with multiple meta tags: [["meta", {...}], ["meta", {...}]]
      if (parsed.every(item => Array.isArray(item) && item.length >= 2 && item[0] === 'meta')) {
        return {
          metaTags: parsed.map((item, index) => ({
            id: index,
            tag: item[0],
            property: item[1]?.property || '',
            content: item[1]?.content || '',
            name: item[1]?.name || '',
            httpEquiv: item[1]?.['http-equiv'] || '',
          })),
        }
      }
    }

    if (type === 'array' && Array.isArray(parsed)) {
      return {
        arrayItems: parsed.map((item, index) => {
          const processedItem = { id: index }

          // 处理每个字段，如果是正则表达式对象则转换为可编辑格式
          for (const [key, value] of Object.entries(item)) {
            if (typeof value === 'object' && value !== null && value.__regex__ !== undefined) {
              // 正则表达式字段，转换为可编辑格式
              processedItem[key] = `/${value.__regex__}/${value.__flags__ || ''}`
            }
            else {
              processedItem[key] = value
            }
          }

          return processedItem
        }),
      }
    }

    if (type === 'json' && typeof parsed === 'object') {
      return parsed
    }
  }
  catch {
    // JSON 解析失败，返回原始值
  }

  return { raw: value }
}

// 重新组装 JSON
function buildJsonFromFields(fields: Record<string, unknown>, type: FieldMetadata['type']): string {
  try {
    if (type === 'regex' && fields.pattern) {
      return JSON.stringify({
        __regex__: fields.pattern,
        __flags__: fields.flags || '',
      })
    }

    if (type === 'meta') {
      // Handle single meta tag
      if (fields.tag) {
        const attrs: Record<string, string> = {}
        if (fields.property)
          attrs.property = fields.property
        if (fields.content)
          attrs.content = fields.content
        if (fields.name)
          attrs.name = fields.name
        if (fields.httpEquiv)
          attrs['http-equiv'] = fields.httpEquiv

        return JSON.stringify([fields.tag, attrs])
      }

      // Handle head array with multiple meta tags
      if (fields.metaTags && Array.isArray(fields.metaTags)) {
        const metaArray = fields.metaTags.map((metaTag: Record<string, unknown>) => {
          const attrs: Record<string, string> = {}
          if (metaTag.property)
            attrs.property = metaTag.property
          if (metaTag.content)
            attrs.content = metaTag.content
          if (metaTag.name)
            attrs.name = metaTag.name
          if (metaTag.httpEquiv)
            attrs['http-equiv'] = metaTag.httpEquiv

          return [metaTag.tag || 'meta', attrs]
        })
        return JSON.stringify(metaArray)
      }
    }

    if (type === 'array' && fields.arrayItems && Array.isArray(fields.arrayItems)) {
      const arrayData = fields.arrayItems.map((item: Record<string, unknown>) => {
        const { id: _id, ...itemData } = item
        const processedItem: Record<string, unknown> = {}

        // 处理每个字段，如果是正则表达式格式则转换回对象
        for (const [key, value] of Object.entries(itemData)) {
          if (typeof value === 'string' && value.match(/^\/.*\/[gimuy]*$/)) {
            // 正则表达式格式，转换回 __regex__ 对象
            const match = value.match(/^\/(.*)\/([gimuy]*)$/)
            if (match) {
              processedItem[key] = {
                __regex__: match[1],
                __flags__: match[2] || '',
              }
            }
            else {
              processedItem[key] = value
            }
          }
          else {
            processedItem[key] = value
          }
        }

        return processedItem
      })
      return JSON.stringify(arrayData)
    }

    if (type === 'json') {
      return JSON.stringify(fields)
    }
  }
  catch {
    // 构建失败
  }

  return fields.raw || ''
}

// 获取编辑器提示
function getEditorHints(entry: TranslationEntry): string[] {
  const metadata = getFieldMetadata(entry)
  return enhancedTranslationService.getFieldHints(entry.path, metadata.type)
}

// 获取语言显示名称
function getLocaleDisplayName(locale: string): string {
  const configKey = locale === 'zh' ? 'root' : locale
  return localesConfig[configKey]?.label || locale
}

// 验证 JSON 格式
function _isValidJson(value: string): boolean {
  if (!value || value.trim() === '')
    return true

  try {
    JSON.parse(value)
    return true
  }
  catch {
    return false
  }
}

// 关闭编辑器
function closeEditor() {
  emit('update:open', false)
}

// 初始化解析字段
function initializeParsedFields() {
  if (!props.entry)
    return

  const metadata = getFieldMetadata(props.entry)
  const newParsedFields: Record<string, Record<string, string>> = {}

  // 初始化本地编辑状态
  localTranslations.value = { ...props.entry.translations }

  for (const locale of props.availableLocales) {
    const value = props.entry.translations[locale]
    newParsedFields[locale] = parseJsonFields(value, metadata.type)
  }

  parsedFields.value = newParsedFields
}

// 监听 entry 变化
watch(() => props.entry, () => {
  if (props.entry) {
    initializeParsedFields()
  }
}, { immediate: true })

// 监听解析字段变化，自动更新原始值
watch(parsedFields, () => {
  if (!props.entry)
    return

  const metadata = getFieldMetadata(props.entry)

  for (const locale of props.availableLocales) {
    if (parsedFields.value[locale]) {
      const newValue = buildJsonFromFields(parsedFields.value[locale], metadata.type)
      if (newValue !== localTranslations.value[locale]) {
        localTranslations.value[locale] = newValue
      }
    }
  }
}, { deep: true })

// 保存编辑
function saveEditor() {
  if (props.entry) {
    // 创建更新后的entry副本
    const updatedEntry = {
      ...props.entry,
      translations: { ...localTranslations.value },
    }
    emit('save', updatedEntry)
  }
  closeEditor()
}

// Meta 标签数组管理
function addMetaTag(locale: string) {
  if (!parsedFields.value[locale]?.metaTags) {
    if (!parsedFields.value[locale]) {
      parsedFields.value[locale] = {}
    }
    parsedFields.value[locale].metaTags = []
  }

  const newId = Math.max(0, ...parsedFields.value[locale].metaTags.map((tag: Record<string, unknown>) => tag.id as number)) + 1
  parsedFields.value[locale].metaTags.push({
    id: newId,
    tag: 'meta',
    property: '',
    content: '',
    name: '',
    httpEquiv: '',
  })
}

function removeMetaTag(locale: string, index: number) {
  if (parsedFields.value[locale]?.metaTags) {
    parsedFields.value[locale].metaTags.splice(index, 1)
  }
}

function updateMetaTag(locale: string, index: number, field: string, value: string) {
  if (parsedFields.value[locale]?.metaTags?.[index]) {
    parsedFields.value[locale].metaTags[index][field] = value
  }
}

// 对象数组管理
function addArrayItem(locale: string) {
  if (!parsedFields.value[locale]?.arrayItems) {
    if (!parsedFields.value[locale]) {
      parsedFields.value[locale] = {}
    }
    parsedFields.value[locale].arrayItems = []
  }

  const newId = Math.max(0, ...parsedFields.value[locale].arrayItems.map((item: Record<string, unknown>) => item.id as number)) + 1
  parsedFields.value[locale].arrayItems.push({
    id: newId,
    label: '',
    value: '',
  })
}

function removeArrayItem(locale: string, index: number) {
  if (parsedFields.value[locale]?.arrayItems) {
    parsedFields.value[locale].arrayItems.splice(index, 1)
  }
}

function updateArrayItem(locale: string, index: number, field: string, value: string) {
  if (parsedFields.value[locale]?.arrayItems?.[index]) {
    parsedFields.value[locale].arrayItems[index][field] = value
  }
}

function addArrayField(locale: string, itemIndex: number) {
  if (parsedFields.value[locale]?.arrayItems?.[itemIndex]) {
    const fieldName = `field_${Date.now()}`
    parsedFields.value[locale].arrayItems[itemIndex][fieldName] = ''
  }
}

function removeArrayField(locale: string, itemIndex: number, fieldName: string) {
  if (parsedFields.value[locale]?.arrayItems?.[itemIndex]) {
    delete parsedFields.value[locale].arrayItems[itemIndex][fieldName]
  }
}

// 检测是否为正则表达式字段
function isRegexField(value: any): boolean {
  return typeof value === 'string' && /^\/.*\/[gimuy]*$/.test(value)
}

// 获取字段显示值，处理 [object Object] 问题
function getDisplayValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-h-[80vh] max-w-4xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          特殊字段编辑器
        </DialogTitle>
        <DialogDescription>
          <div v-if="entry" class="space-y-2">
            <p>字段路径: <code class="rounded bg-muted px-1 text-sm">{{ entry.path }}</code></p>
            <p>类型: <span class="font-medium">{{ getFieldMetadata(entry).type.toUpperCase() }}</span></p>
            <p class="text-xs text-muted-foreground">
              {{ getFieldMetadata(entry).description }}
            </p>
          </div>
        </DialogDescription>
      </DialogHeader>

      <div v-if="entry" class="space-y-6">
        <!-- 提示信息 -->
        <div v-if="getEditorHints(entry).length > 0" class="rounded-lg bg-muted/50 p-4">
          <h4 class="mb-2 text-sm font-medium">
            编辑提示:
          </h4>
          <ul class="list-disc list-inside text-sm space-y-1">
            <li v-for="hint in getEditorHints(entry)" :key="hint" class="text-muted-foreground">
              {{ hint }}
            </li>
          </ul>
        </div>

        <!-- 多语言编辑标签页 -->
        <div class="space-y-4">
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

          <!-- 普通文本字段 -->
          <div v-if="getFieldMetadata(entry).type === 'text'" class="space-y-2">
            <Label>{{ getLocaleDisplayName(editingLocale) }}</Label>
            <Input
              v-model="localTranslations[editingLocale]"
              placeholder="输入文本内容..."
            />
          </div>

          <!-- 正则表达式字段 -->
          <div v-else-if="getFieldMetadata(entry).type === 'regex'" class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label>正则表达式模式</Label>
                <Input
                  :model-value="getFieldValue(editingLocale, 'pattern')"
                  placeholder="例如: ^[a-z]+$"
                  @update:model-value="setFieldValue(editingLocale, 'pattern', $event)"
                />
              </div>
              <div class="space-y-2">
                <Label>标志 (可选)</Label>
                <Input
                  :model-value="getFieldValue(editingLocale, 'flags')"
                  placeholder="例如: i, g, m"
                  @update:model-value="setFieldValue(editingLocale, 'flags', $event)"
                />
              </div>
            </div>
          </div>

          <!-- Meta 标签字段 -->
          <div v-else-if="getFieldMetadata(entry).type === 'meta'" class="space-y-3">
            <!-- 单个 Meta 标签编辑 -->
            <div v-if="parsedFields[editingLocale]?.tag" class="space-y-3">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>标签类型</Label>
                  <Input
                    :model-value="getFieldValue(editingLocale, 'tag')"
                    placeholder="例如: meta"
                    @update:model-value="setFieldValue(editingLocale, 'tag', $event)"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Property</Label>
                  <Input
                    :model-value="getFieldValue(editingLocale, 'property')"
                    placeholder="例如: og:title"
                    @update:model-value="setFieldValue(editingLocale, 'property', $event)"
                  />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label>Content</Label>
                  <Input
                    :model-value="getFieldValue(editingLocale, 'content')"
                    placeholder="标签内容"
                    @update:model-value="setFieldValue(editingLocale, 'content', $event)"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Name (可选)</Label>
                  <Input
                    :model-value="getFieldValue(editingLocale, 'name')"
                    placeholder="name 属性"
                    @update:model-value="setFieldValue(editingLocale, 'name', $event)"
                  />
                </div>
              </div>
            </div>

            <!-- Head 标签数组编辑 -->
            <div v-else-if="parsedFields[editingLocale]?.metaTags" class="space-y-4">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium">Meta 标签列表</Label>
                <Button
                  size="sm"
                  variant="outline"
                  @click="addMetaTag(editingLocale)"
                >
                  <i class="i-lucide-plus mr-1 h-3 w-3" />
                  添加标签
                </Button>
              </div>

              <div
                v-for="(metaTag, index) in parsedFields[editingLocale]?.metaTags"
                :key="metaTag.id"
                class="border rounded-lg p-4 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground font-medium">Meta 标签 #{{ index + 1 }}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="removeMetaTag(editingLocale, index)"
                  >
                    <i class="i-lucide-trash-2 h-3 w-3" />
                  </Button>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <Label class="text-xs">Property</Label>
                    <Input
                      :model-value="metaTag.property"
                      placeholder="例如: og:title"
                      class="text-xs"
                      @update:model-value="updateMetaTag(editingLocale, index, 'property', $event)"
                    />
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs">Content</Label>
                    <Input
                      :model-value="metaTag.content"
                      placeholder="标签内容"
                      class="text-xs"
                      @update:model-value="updateMetaTag(editingLocale, index, 'content', $event)"
                    />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="space-y-1">
                    <Label class="text-xs">Name (可选)</Label>
                    <Input
                      :model-value="metaTag.name"
                      placeholder="name 属性"
                      class="text-xs"
                      @update:model-value="updateMetaTag(editingLocale, index, 'name', $event)"
                    />
                  </div>
                  <div class="space-y-1">
                    <Label class="text-xs">HTTP-Equiv (可选)</Label>
                    <Input
                      :model-value="metaTag.httpEquiv"
                      placeholder="http-equiv 属性"
                      class="text-xs"
                      @update:model-value="updateMetaTag(editingLocale, index, 'httpEquiv', $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 对象数组字段 -->
          <div v-else-if="getFieldMetadata(entry).type === 'array'" class="space-y-4">
            <div v-if="parsedFields[editingLocale]?.arrayItems" class="space-y-4">
              <div class="flex items-center justify-between">
                <Label class="text-sm font-medium">对象数组项目</Label>
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
                v-for="(arrayItem, index) in parsedFields[editingLocale]?.arrayItems"
                :key="arrayItem.id"
                class="border rounded-lg p-4 space-y-3"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground font-medium">项目 #{{ index + 1 }}</span>
                  <div class="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      @click="addArrayField(editingLocale, index)"
                    >
                      <i class="i-lucide-plus h-3 w-3" />
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

                <div class="grid grid-cols-1 gap-3">
                  <div
                    v-for="(value, fieldKey) in arrayItem"
                    :key="fieldKey"
                    class="flex items-center gap-2"
                  >
                    <template v-if="fieldKey !== 'id'">
                      <Label class="min-w-[80px] flex items-center gap-1 text-xs">
                        {{ fieldKey }}
                        <i
                          v-if="isRegexField(value)"
                          class="i-lucide-code h-3 w-3 text-blue-500"
                          title="正则表达式"
                        />
                      </Label>
                      <Input
                        :model-value="getDisplayValue(value)"
                        :placeholder="isRegexField(value) ? '例如: /pattern/flags' : `输入 ${fieldKey}...`"
                        class="flex-1 text-xs"
                        :class="isRegexField(value) ? 'font-mono' : ''"
                        @update:model-value="updateArrayItem(editingLocale, index, fieldKey as string, $event)"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        @click="removeArrayField(editingLocale, index, fieldKey as string)"
                      >
                        <i class="i-lucide-x h-3 w-3" />
                      </Button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- JSON 对象字段 -->
          <div v-else-if="getFieldMetadata(entry).type === 'json'" class="space-y-2">
            <Label>{{ getLocaleDisplayName(editingLocale) }} (JSON 对象)</Label>
            <div v-if="parsedFields[editingLocale] && typeof parsedFields[editingLocale] === 'object'" class="space-y-3">
              <div
                v-for="(value, key) in parsedFields[editingLocale]"
                :key="key"
                class="grid grid-cols-3 items-center gap-2"
              >
                <Label class="text-sm">{{ key }}</Label>
                <Input
                  :model-value="getFieldValue(editingLocale, key as string)"
                  class="col-span-2"
                  @update:model-value="setFieldValue(editingLocale, key as string, $event)"
                />
              </div>
            </div>
            <div v-else class="space-y-2">
              <Textarea
                v-model="localTranslations[editingLocale]"
                rows="6"
                class="text-sm font-mono"
                placeholder="输入 JSON 数据..."
              />
            </div>
          </div>

          <!-- 只读字段 -->
          <div v-else-if="getFieldMetadata(entry).type === 'readonly'" class="space-y-2">
            <Label class="text-muted-foreground">{{ getLocaleDisplayName(editingLocale) }} (只读)</Label>
            <Input
              :value="entry.translations[editingLocale]"
              class="bg-muted font-mono"
              readonly
            />
            <p class="text-xs text-amber-600">
              <i class="i-lucide-alert-triangle mr-1 inline h-3 w-3" />
              此字段为系统配置，修改可能影响应用功能
            </p>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="closeEditor">
            取消
          </Button>
          <Button @click="saveEditor">
            <i class="i-lucide-save mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
