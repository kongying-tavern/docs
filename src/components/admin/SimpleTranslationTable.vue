<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

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

// 编辑状态
const editingCell = ref<{ entryPath: string, locale: string } | null>(null)

// 获取语言显示名称
function getLocaleDisplayName(locale: string): string {
  const localeNames: Record<string, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
  }
  return localeNames[locale] || locale
}

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
</script>

<template>
  <div class="space-y-4">
    <!-- 主表格 -->
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[80px]">
              状态
            </TableHead>
            <TableHead class="w-[120px]">
              分类
            </TableHead>
            <TableHead class="w-[200px]">
              翻译键
            </TableHead>
            <TableHead
              v-for="locale in availableLocales"
              :key="locale"
              class="min-w-[180px]"
            >
              {{ getLocaleDisplayName(locale) }}
            </TableHead>
            <TableHead class="w-[120px]">
              操作
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
              <div v-if="isEditing(entry, locale)">
                <Input
                  v-model="entry.translations[locale]"
                  class="text-xs"
                  :disabled="entry.isDeleted"
                  @blur="handleBlur(entry)"
                  @keyup.enter="handleEnter(entry)"
                  @keyup.escape="stopEdit"
                />
              </div>
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
                  title="编辑"
                  @click="$emit('edit', entry)"
                >
                  <i class="i-lucide-edit h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <!-- 空状态 -->
      <div v-if="entries.length === 0" class="flex flex-col items-center justify-center py-12">
        <div class="text-center">
          <h3 class="text-lg font-medium">
            没有找到翻译条目
          </h3>
          <p class="text-sm text-muted-foreground">
            尝试调整搜索条件或过滤器
          </p>
        </div>
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
  </div>
</template>
