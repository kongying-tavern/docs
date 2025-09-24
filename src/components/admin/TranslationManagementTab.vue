<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useTranslationExport } from '~/composables/useTranslationExport'
import { useTranslationTableLogic } from '~/composables/useTranslationTableLogic'
import { jsonTranslationService } from '~/services/jsonTranslationService'
import AddEntryDialog from './AddEntryDialog.vue'
import TranslationEditDialog from './TranslationEditDialog.vue'
import TranslationExportPreview from './TranslationExportPreview.vue'
import TranslationStatsAndFilters from './TranslationStatsAndFilters.vue'
import TranslationTable from './TranslationTable.vue'

interface Props {
  availableLocales: string[]
  translationEntries: TranslationEntry[]
  categories: string[]
}

const props = defineProps<Props>()

// 定义 emits 来通知父组件数据变化
const emit = defineEmits<{
  'entries-updated': []
}>()

// 使用表格逻辑 composable
const tableLogic = useTranslationTableLogic({
  translationEntries: () => props.translationEntries,
  availableLocales: () => props.availableLocales,
  categories: () => props.categories,
})

// 使用导出功能 composable
const exportLogic = useTranslationExport({
  translationEntries: () => props.translationEntries,
  availableLocales: () => props.availableLocales,
  categories: () => props.categories,
})

// 编辑状态
const editDialogOpen = ref(false)
const editingEntry = ref<TranslationEntry | null>(null)

// 添加条目状态
const addEntryDialogOpen = ref(false)

// 事件处理
function editTranslation(entry: TranslationEntry) {
  editingEntry.value = { ...entry }
  editDialogOpen.value = true
}

function handleAutoSaveTranslation(entry: TranslationEntry) {
  const index = props.translationEntries.findIndex(e => e.path === entry.path)
  if (index !== -1) {
    const originalEntry = props.translationEntries[index]

    // 检查每个语言字段的变更并自动保存
    props.availableLocales.forEach(locale => {
      const oldValue = originalEntry.translations[locale]
      const newValue = entry.translations[locale]

      // 如果值发生变更，自动保存到本地存储
      if (oldValue !== newValue) {
        jsonTranslationService.updateTranslation(entry.path, locale, newValue)
      }
    })

    // 更新条目状态
    Object.assign(props.translationEntries[index], entry)

    // 重新标记修改状态（这会保存所有变更到本地存储）
    jsonTranslationService.markEntryAsModified(props.translationEntries[index])
  }
}

function openAddEntryDialog() {
  console.log('Opening add entry dialog')
  addEntryDialogOpen.value = true
  console.log('addEntryDialogOpen.value:', addEntryDialogOpen.value)
}

function handleEntryAdded() {
  // 通知父组件数据已更新
  emit('entries-updated')
}

function handleCellEdit(entry: TranslationEntry) {
  // 表格内编辑处理，和对话框编辑使用相同的逻辑
  handleAutoSaveTranslation(entry)
}

function handleDeleteEntry(entry: TranslationEntry) {
  // 删除条目（service 会直接修改内部状态）
  jsonTranslationService.deleteEntry(entry.path)

  // 通知父组件数据已更新，触发重新渲染
  emit('entries-updated')

  toast.success('条目已删除')
}

function handleRestoreEntry(entry: TranslationEntry) {
  // 恢复条目（service 会直接修改内部状态）
  jsonTranslationService.restoreEntry(entry.path)

  // 通知父组件数据已更新，触发重新渲染
  emit('entries-updated')

  toast.success('条目已恢复')
}

function handleInitializeData() {
  // 清除所有本地存储的修改和删除数据
  jsonTranslationService.clearStoredModifications()

  // 通知父组件数据已更新，触发重新渲染
  emit('entries-updated')

  toast.success('数据已初始化，所有本地修改已清除')
}
</script>

<template>
  <div class="space-y-6">
    <!-- 统计信息和过滤器 -->
    <TranslationStatsAndFilters
      :stats="tableLogic.stats.value"
      :search-query="tableLogic.searchQuery.value"
      :selected-category="tableLogic.selectedCategory.value"
      :categories="categories"
      @update:search="tableLogic.updateSearchQuery"
      @update:category="tableLogic.updateSelectedCategory"
    />

    <!-- 翻译表格 -->
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>翻译条目</CardTitle>
            <CardDescription>管理和编辑多语言翻译内容</CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger as-child>
                <Button
                  variant="outline"
                  :disabled="!exportLogic.hasChanges.value"
                >
                  <i class="i-lucide-refresh-ccw mr-2 h-4 w-4" />
                  初始化数据
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>确认初始化数据</AlertDialogTitle>
                  <AlertDialogDescription>
                    此操作将清除所有本地保存的修改和删除记录，恢复到原始状态。
                    <br />
                    当前有 <strong>{{ exportLogic.changedLocales.value.length }}</strong> 个语言包含未导出的变更。
                    <br />
                    <strong>此操作不可逆，请确认是否继续？</strong>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction @click="handleInitializeData">
                    确认初始化
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              variant="outline"
              :disabled="!exportLogic.hasChanges.value"
              @click="exportLogic.handleSmartExport"
            >
              <i class="i-lucide-download mr-2 h-4 w-4" />
              导出变更
              <span v-if="exportLogic.changedLocales.value.length > 0" class="ml-1 rounded bg-primary px-1 text-xs text-primary-foreground">
                {{ exportLogic.changedLocales.value.length }}
              </span>
            </Button>
            <Button @click="openAddEntryDialog">
              <i class="i-lucide-plus mr-2 h-4 w-4" />
              添加条目
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- 翻译表格 -->
        <TranslationTable
          :entries="tableLogic.paginatedEntries.value"
          :available-locales="availableLocales"
          :total-pages="tableLogic.totalPages.value"
          :current-page="tableLogic.currentPage.value"
          :total-entries="tableLogic.filteredEntries.value.length"
          :page-size="tableLogic.pageSize"
          @edit="editTranslation"
          @page-change="tableLogic.handlePageChange"
          @cell-edit="handleCellEdit"
          @delete="handleDeleteEntry"
          @restore="handleRestoreEntry"
          @sort-change="tableLogic.handleSort"
        />
      </CardContent>
    </Card>

    <!-- 添加条目对话框 -->
    <AddEntryDialog
      v-model:open="addEntryDialogOpen"
      :available-locales="availableLocales"
      :categories="categories"
      @entry-added="handleEntryAdded"
    />

    <!-- 编辑对话框 -->
    <TranslationEditDialog
      v-model:open="editDialogOpen"
      :entry="editingEntry"
      :available-locales="availableLocales"
      @auto-save="handleAutoSaveTranslation"
    />

    <!-- 导出预览对话框 -->
    <TranslationExportPreview
      v-model:open="exportLogic.exportPreviewOpen.value"
      :preview-data="exportLogic.previewData.value"
      :get-locale-display-name="exportLogic.getLocaleDisplayName"
      @confirm-export="exportLogic.confirmExport"
    />
  </div>
</template>
