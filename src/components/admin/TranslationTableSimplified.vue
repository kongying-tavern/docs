<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { localesConfig } from '../../../.vitepress/config/locales'
import SpecialFieldEditor from './SpecialFieldEditor.vue'
import TranslationTableRow from './TranslationTableRow.vue'

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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 排序状态管理
type SortDirection = 'asc' | 'desc' | null
type SortColumn = 'category' | 'key' | 'status' | string

const sortColumn = ref<SortColumn | null>(null)
const sortDirection = ref<SortDirection>(null)

// 特殊编辑器状态
const specialEditorEntry = ref<TranslationEntry | null>(null)
const specialEditorOpen = ref(false)

// 排序后的条目
const sortedEntries = computed(() => {
  if (!sortColumn.value || !sortDirection.value) {
    return props.entries
  }

  return [...props.entries].sort((a, b) => {
    let valueA: string | number
    let valueB: string | number

    switch (sortColumn.value) {
      case 'status':
        valueA = a.isDeleted ? 2 : (a.isModified ? 1 : 0)
        valueB = b.isDeleted ? 2 : (b.isModified ? 1 : 0)
        break
      case 'category':
        valueA = a.category
        valueB = b.category
        break
      case 'key':
        valueA = a.key
        valueB = b.key
        break
      default:
        if (props.availableLocales.includes(sortColumn.value)) {
          valueA = a.translations[sortColumn.value] || ''
          valueB = b.translations[sortColumn.value] || ''
        }
        else {
          return 0
        }
    }

    if (typeof valueA === 'string' && typeof valueB === 'string') {
      valueA = valueA.toLowerCase()
      valueB = valueB.toLowerCase()
    }

    if (valueA < valueB) {
      return sortDirection.value === 'asc' ? -1 : 1
    }
    if (valueA > valueB) {
      return sortDirection.value === 'asc' ? 1 : -1
    }
    return 0
  })
})

// 获取语言显示名称
function getLocaleDisplayName(locale: string): string {
  const configKey = locale === 'zh' ? 'root' : locale
  return localesConfig[configKey]?.label || locale
}

// 排序处理
function handleSort(column: SortColumn) {
  if (sortColumn.value === column) {
    if (sortDirection.value === 'asc') {
      sortDirection.value = 'desc'
    }
    else if (sortDirection.value === 'desc') {
      sortDirection.value = null
      sortColumn.value = null
    }
    else {
      sortDirection.value = 'asc'
    }
  }
  else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

// 获取排序图标
function getSortIcon(column: SortColumn): string {
  if (sortColumn.value !== column) {
    return 'i-lucide-arrow-up-down'
  }

  if (sortDirection.value === 'asc') {
    return 'i-lucide-arrow-up'
  }
  else if (sortDirection.value === 'desc') {
    return 'i-lucide-arrow-down'
  }

  return 'i-lucide-arrow-up-down'
}

// 特殊编辑器处理
function openSpecialEditor(entry: TranslationEntry) {
  specialEditorEntry.value = entry
  specialEditorOpen.value = true
}

function handleSpecialEditorSave(entry: TranslationEntry) {
  emit('cell-edit', entry)
}
</script>

<template>
  <div class="space-y-4">
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <!-- 状态列 -->
            <TableHead
              class="w-[80px] cursor-pointer select-none transition-colors duration-200 hover:bg-muted/50"
              @click="handleSort('status')"
            >
              <div class="flex items-center gap-1">
                状态
                <i :class="getSortIcon('status')" class="h-3 w-3 transition-transform duration-200" />
              </div>
            </TableHead>

            <!-- 分类列 -->
            <TableHead
              class="w-[120px] cursor-pointer select-none hover:bg-muted/50"
              @click="handleSort('category')"
            >
              <div class="flex items-center gap-1">
                分类
                <i :class="getSortIcon('category')" class="h-3 w-3" />
              </div>
            </TableHead>

            <!-- 键名列 -->
            <TableHead
              class="w-[200px] cursor-pointer select-none hover:bg-muted/50"
              @click="handleSort('key')"
            >
              <div class="flex items-center gap-1">
                翻译键
                <i :class="getSortIcon('key')" class="h-3 w-3" />
              </div>
            </TableHead>

            <!-- 语言列 -->
            <TableHead
              v-for="locale in availableLocales"
              :key="locale"
              class="min-w-[180px] cursor-pointer select-none hover:bg-muted/50"
              @click="handleSort(locale)"
            >
              <div class="flex items-center gap-1">
                {{ getLocaleDisplayName(locale) }}
                <i :class="getSortIcon(locale)" class="h-3 w-3" />
              </div>
            </TableHead>

            <!-- 操作列 -->
            <TableHead class="w-[120px]">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          <TranslationTableRow
            v-for="(entry, index) in sortedEntries"
            :key="entry.path"
            :entry="entry"
            :available-locales="availableLocales"
            :index="index"
            @edit="$emit('edit', entry)"
            @delete="$emit('delete', entry)"
            @restore="$emit('restore', entry)"
            @special-edit="openSpecialEditor"
            @cell-edit="$emit('cell-edit', entry)"
          />
        </TableBody>
      </Table>

      <!-- 空状态 -->
      <div v-if="entries.length === 0" class="flex flex-col items-center justify-center py-12">
        <i class="i-lucide-search mb-4 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-medium">
          没有找到翻译条目
        </h3>
        <p class="text-sm text-muted-foreground">
          尝试调整搜索条件或过滤器
        </p>
      </div>
    </div>

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
          @click="$emit('page-change', currentPage - 1)"
        >
          <i class="i-lucide-chevron-left h-4 w-4" />
        </Button>
        <span class="px-2 text-sm">
          {{ currentPage }} / {{ totalPages }}
        </span>
        <Button
          :disabled="currentPage >= totalPages"
          variant="outline"
          size="sm"
          @click="$emit('page-change', currentPage + 1)"
        >
          <i class="i-lucide-chevron-right h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- 特殊字段编辑器 -->
    <SpecialFieldEditor
      v-model:open="specialEditorOpen"
      :entry="specialEditorEntry"
      :available-locales="availableLocales"
      @save="handleSpecialEditorSave"
    />
  </div>
</template>
