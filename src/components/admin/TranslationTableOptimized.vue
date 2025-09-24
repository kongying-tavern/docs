<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { computed, ref } from 'vue'
import { Table, TableBody } from '@/components/ui/table'
import SpecialFieldEditor from './SpecialFieldEditor.vue'
import TranslationTableHeader from './TranslationTableHeader.vue'
import TranslationTablePagination from './TranslationTablePagination.vue'
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

// 排序状态
type SortDirection = 'asc' | 'desc' | null
type SortColumn = 'category' | 'key' | 'status' | string

const sortColumn = ref<SortColumn | null>(null)
const sortDirection = ref<SortDirection>(null)

// 特殊编辑器状态
const specialEditorEntry = ref<TranslationEntry | null>(null)
const specialEditorOpen = ref(false)

// 排序逻辑
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

    const result = valueA < valueB ? -1 : valueA > valueB ? 1 : 0
    return sortDirection.value === 'asc' ? result : -result
  })
})

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

// 特殊编辑器
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
    <!-- 主表格 -->
    <div class="border rounded-md">
      <Table>
        <TranslationTableHeader
          :available-locales="availableLocales"
          :sort-column="sortColumn"
          :sort-direction="sortDirection"
          @sort="handleSort"
        />
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
    <TranslationTablePagination
      :current-page="currentPage"
      :total-pages="totalPages"
      :total-entries="totalEntries"
      :page-size="pageSize"
      @page-change="$emit('page-change', $event)"
    />

    <!-- 特殊字段编辑器 -->
    <SpecialFieldEditor
      v-model:open="specialEditorOpen"
      :entry="specialEditorEntry"
      :available-locales="availableLocales"
      @save="handleSpecialEditorSave"
    />
  </div>
</template>
