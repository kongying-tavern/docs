<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import SpecialFieldEditor from './SpecialFieldEditor.vue'

interface Props {
  entries: TranslationEntry[]
  availableLocales: string[]
  totalPages: number
  currentPage: number
  totalEntries: number
  pageSize: number
}

interface Emits {
  (e: 'edit', entry: TranslationEntry): void
  (e: 'page-change', page: number): void
  (e: 'cell-edit', entry: TranslationEntry): void
  (e: 'delete', entry: TranslationEntry): void
  (e: 'restore', entry: TranslationEntry): void
  (e: 'special-edit', entry: TranslationEntry): void
  (e: 'sort-change', sortBy: string, sortOrder: 'asc' | 'desc'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 编辑状态
const editingCell = ref<{ entryPath: string, locale: string } | null>(null)

// 排序状态
const sortBy = ref<string>('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 特殊字段编辑器状态
const specialFieldEditor = ref({
  open: false,
  entry: null as TranslationEntry | null,
})

// 获取语言显示名称
function getLocaleDisplayName(locale: string): string {
  const localeNames: Record<string, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
  }
  return localeNames[locale] || locale
}

// 排序处理
function handleSort(column: string) {
  if (sortBy.value === column) {
    // 如果点击的是当前排序列，切换排序方向
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  }
  else {
    // 如果点击的是新列，设置为升序
    sortBy.value = column
    sortOrder.value = 'asc'
  }

  // 发射排序变化事件
  emit('sort-change', sortBy.value, sortOrder.value)
}

// 获取排序图标
function getSortIcon(column: string): string {
  if (sortBy.value !== column) {
    return 'i-lucide-chevrons-up-down'
  }
  return sortOrder.value === 'asc' ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'
}

// 表头配置
const tableHeaders = [
  { key: 'status', label: '状态', icon: 'i-lucide-circle-dot', width: 'w-[100px]' },
  { key: 'category', label: '分类', icon: 'i-lucide-folder', width: 'w-[120px]' },
  { key: 'key', label: '翻译键', icon: 'i-lucide-key', width: 'w-[200px]' },
  { key: 'actions', label: '操作', icon: 'i-lucide-settings', width: 'w-[120px]' },
] as const

// 开始编辑单元格
function startEdit(entry: TranslationEntry, locale: string) {
  editingCell.value = { entryPath: entry.path, locale }
}

// 停止编辑
function stopEdit() {
  editingCell.value = null
}

// 处理输入框失焦
function handleBlur(entry: TranslationEntry) {
  stopEdit()
  emit('cell-edit', entry)
}

// 处理回车键
function handleEnter(entry: TranslationEntry) {
  stopEdit()
  emit('cell-edit', entry)
}

// 判断是否正在编辑
function isEditing(entry: TranslationEntry, locale: string): boolean {
  return editingCell.value?.entryPath === entry.path && editingCell.value?.locale === locale
}

// 分页控制
function handlePrevPage() {
  if (props.currentPage > 1) {
    emit('page-change', props.currentPage - 1)
  }
}

function handleNextPage() {
  if (props.currentPage < props.totalPages) {
    emit('page-change', props.currentPage + 1)
  }
}

// 检测是否为特殊数据类型
function isSpecialDataType(value: string, path?: string): boolean {
  if (!value)
    return false

  // 检测路径模式
  if (path) {
    // head 字段包含 meta 标签数组
    if (path === 'head') {
      return true
    }
  }

  try {
    const parsed = JSON.parse(value)

    // 检测正则表达式格式
    if (typeof parsed === 'object' && parsed.__regex__ !== undefined) {
      return true
    }

    // 检测meta标签格式 ["meta", {...}]
    if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0] === 'meta') {
      return true
    }

    // 检测 head 字段的 meta 标签数组
    if (Array.isArray(parsed) && parsed.every(item =>
      Array.isArray(item) && item.length >= 2 && item[0] === 'meta',
    )) {
      return true
    }

    // 检测对象数组（如 issueOptions, navigationItems 等）
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
    )) {
      return true
    }

    // 检测复杂的嵌套对象
    if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 3) {
      return true
    }
  }
  catch {
    return false
  }

  return false
}

// 获取特殊数据类型的预览文本
function getSpecialDataPreview(value: string): string {
  if (!value)
    return '(空)'

  try {
    const parsed = JSON.parse(value)

    // 正则表达式预览
    if (typeof parsed === 'object' && parsed.__regex__ !== undefined) {
      const flags = parsed.__flags__ ? `/${parsed.__flags__}` : ''
      return `/${parsed.__regex__}${flags}`
    }

    // Meta标签预览
    if (Array.isArray(parsed) && parsed.length >= 2 && parsed[0] === 'meta') {
      const attrs = parsed[1] || {}
      if (attrs.property) {
        return `meta[${attrs.property}]`
      }
      if (attrs.name) {
        return `meta[${attrs.name}]`
      }
      return 'meta[...]'
    }

    // Head 字段的 meta 标签数组预览
    if (Array.isArray(parsed) && parsed.every(item =>
      Array.isArray(item) && item.length >= 2 && item[0] === 'meta',
    )) {
      const count = parsed.length
      const firstMeta = parsed[0]?.[1]
      const firstProperty = firstMeta?.property || firstMeta?.name || '...'
      return `Head: ${count} meta tags (${firstProperty}...)`
    }

    // 对象数组预览
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(item =>
      typeof item === 'object' && item !== null && !Array.isArray(item),
    )) {
      const count = parsed.length
      const firstItem = parsed[0]
      const firstLabel = firstItem.label || firstItem.text || firstItem.name || Object.values(firstItem)[0]
      return `Array: ${count} items (${firstLabel}...)`
    }

    // 复杂对象预览
    if (typeof parsed === 'object' && !Array.isArray(parsed)) {
      const keys = Object.keys(parsed)
      return `{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '...' : ''}}`
    }
  }
  catch {
    // 如果不是JSON，检查是否是长文本
    if (value.length > 50) {
      return `${value.substring(0, 47)}...`
    }
  }

  return value
}

// 检测条目是否包含特殊数据类型
function hasSpecialDataType(entry: TranslationEntry): boolean {
  return props.availableLocales.some(locale =>
    isSpecialDataType(entry.translations[locale], entry.path),
  )
}

// 开始特殊字段编辑
function startSpecialEdit(entry: TranslationEntry) {
  specialFieldEditor.value = {
    open: true,
    entry: { ...entry }, // 创建副本以避免直接修改
  }
}

// 处理编辑按钮点击
function handleEditClick(entry: TranslationEntry) {
  if (hasSpecialDataType(entry)) {
    // 如果包含特殊数据类型，使用内置的特殊编辑器
    startSpecialEdit(entry)
  }
  else {
    // 否则使用外部的通用编辑器
    emit('edit', entry)
  }
}

// 保存特殊字段编辑
function saveSpecialEdit(editedEntry: TranslationEntry) {
  if (specialFieldEditor.value.entry) {
    // 更新原始条目
    const originalEntry = props.entries.find(e => e.path === editedEntry.path)
    if (originalEntry) {
      Object.assign(originalEntry, editedEntry)
      emit('cell-edit', originalEntry)
    }
  }
  specialFieldEditor.value.open = false
  specialFieldEditor.value.entry = null
}

// 关闭特殊字段编辑器
function closeSpecialEditor() {
  specialFieldEditor.value.open = false
  specialFieldEditor.value.entry = null
}
</script>

<template>
  <div class="space-y-4">
    <!-- 主表格 -->
    <Card>
      <CardHeader class="pb-4">
        <CardTitle class="flex items-center gap-2 text-base font-semibold">
          <i class="i-lucide-languages h-5 w-5" />
          翻译条目
        </CardTitle>
      </CardHeader>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <!-- 固定列 -->
              <TableHead
                v-for="header in tableHeaders.slice(0, 3)"
                :key="header.key"
                :class="header.width"
              >
                <div
                  class="flex cursor-pointer items-center gap-1 rounded p-1 transition-colors hover:bg-muted/50"
                  @click="handleSort(header.key)"
                >
                  <i class="h-4 w-4" :class="[header.icon]" />
                  {{ header.label }}
                  <i class="ml-auto h-3 w-3 opacity-60" :class="[getSortIcon(header.key)]" />
                </div>
              </TableHead>

              <!-- 语言列 -->
              <TableHead
                v-for="locale in availableLocales"
                :key="locale"
                class="min-w-[180px]"
              >
                <div
                  class="flex cursor-pointer items-center gap-1 rounded p-1 transition-colors hover:bg-muted/50"
                  @click="handleSort(`translation_${locale}`)"
                >
                  <i class="i-lucide-globe h-4 w-4" />
                  {{ getLocaleDisplayName(locale) }}
                  <i class="ml-auto h-3 w-3 opacity-60" :class="[getSortIcon(`translation_${locale}`)]" />
                </div>
              </TableHead>

              <!-- 操作列 -->
              <TableHead :class="tableHeaders[3].width">
                <div class="flex items-center gap-1">
                  <i class="h-4 w-4" :class="[tableHeaders[3].icon]" />
                  {{ tableHeaders[3].label }}
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="entry in entries"
              :key="entry.path"
              :class="{
                'opacity-50': entry.isDeleted,
              }"
            >
              <!-- 状态列 -->
              <TableCell>
                <span
                  v-if="entry.isDeleted"
                  class="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 font-medium"
                >
                  已删除
                </span>
                <span
                  v-else-if="entry.isModified"
                  class="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800 font-medium"
                >
                  已修改
                </span>
                <span
                  v-else
                  class="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 font-medium"
                >
                  正常
                </span>
              </TableCell>

              <!-- 分类列 -->
              <TableCell>
                <span class="rounded bg-muted px-2 py-1 text-xs font-medium">
                  {{ entry.category }}
                </span>
              </TableCell>

              <!-- 键名列 -->
              <TableCell class="text-xs font-mono">
                {{ entry.key }}
              </TableCell>

              <!-- 语言列 -->
              <TableCell
                v-for="locale in availableLocales"
                :key="locale"
                class="max-w-[200px]"
              >
                <!-- 特殊数据类型 -->
                <div v-if="isSpecialDataType(entry.translations[locale], entry.path)">
                  <div
                    class="flex cursor-pointer items-center gap-2 truncate rounded p-1 text-xs hover:bg-muted/50"
                    :class="{ 'text-muted-foreground': entry.isDeleted }"
                    @click="!entry.isDeleted && startSpecialEdit(entry)"
                  >
                    <i class="i-lucide-settings h-3 w-3 flex-shrink-0 text-blue-500" />
                    <span class="truncate">{{ getSpecialDataPreview(entry.translations[locale]) }}</span>
                  </div>
                </div>

                <!-- 普通文本编辑 -->
                <div v-else-if="isEditing(entry, locale)">
                  <Input
                    v-model="entry.translations[locale]"
                    class="text-xs"
                    :disabled="entry.isDeleted"
                    @blur="handleBlur(entry)"
                    @keyup.enter="handleEnter(entry)"
                    @keyup.escape="stopEdit"
                  />
                </div>

                <!-- 普通文本显示 -->
                <div
                  v-else
                  class="cursor-pointer truncate rounded p-1 text-xs hover:bg-muted/50"
                  :class="{ 'text-muted-foreground': entry.isDeleted }"
                  @click="!entry.isDeleted && startEdit(entry, locale)"
                >
                  {{ entry.translations[locale] || '(空)' }}
                </div>
              </TableCell>

              <!-- 操作列 -->
              <TableCell>
                <div class="flex items-center gap-1">
                  <Button
                    v-if="entry.isDeleted"
                    variant="ghost"
                    size="sm"
                    title="恢复"
                    @click="$emit('restore', entry)"
                  >
                    <i class="i-lucide-undo h-4 w-4" />
                  </Button>
                  <Button
                    v-else
                    variant="ghost"
                    size="sm"
                    title="删除"
                    @click="$emit('delete', entry)"
                  >
                    <i class="i-lucide-trash-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    :disabled="entry.isDeleted"
                    :title="hasSpecialDataType(entry) ? '配置编辑' : '编辑'"
                    @click="handleEditClick(entry)"
                  >
                    <i v-if="hasSpecialDataType(entry)" class="i-lucide-settings h-4 w-4" />
                    <i v-else class="i-lucide-edit h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- 空状态 -->
        <div v-if="entries.length === 0" class="flex flex-col items-center justify-center py-12">
          <div class="text-center">
            <div class="mx-auto mb-4 h-16 w-16 flex items-center justify-center rounded-full bg-muted">
              <i class="i-lucide-search h-8 w-8 text-muted-foreground" />
            </div>
            <h3 class="text-lg font-medium">
              没有找到翻译条目
            </h3>
            <p class="text-sm text-muted-foreground">
              尝试调整搜索条件或过滤器
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 分页 -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        显示 {{ Math.min((currentPage - 1) * pageSize + 1, totalEntries) }} -
        {{ Math.min(currentPage * pageSize, totalEntries) }} 条，
        共 {{ totalEntries }} 条
      </div>
      <div class="flex items-center space-x-2">
        <Button
          :disabled="currentPage <= 1"
          variant="outline"
          size="sm"
          @click="handlePrevPage"
        >
          上一页
        </Button>
        <span class="px-2 text-sm">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <Button
          :disabled="currentPage >= totalPages"
          variant="outline"
          size="sm"
          @click="handleNextPage"
        >
          下一页
        </Button>
      </div>
    </div>

    <!-- 特殊字段编辑器 -->
    <SpecialFieldEditor
      v-model:open="specialFieldEditor.open"
      :entry="specialFieldEditor.entry"
      :available-locales="availableLocales"
      @save="saveSpecialEdit"
      @update:open="closeSpecialEditor"
    />
  </div>
</template>
