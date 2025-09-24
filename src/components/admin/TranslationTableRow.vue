<script setup lang="ts">
import type { FieldMetadata } from '~/services/enhancedTranslationService'
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { enhancedTranslationService } from '~/services/enhancedTranslationService'
import FieldTypeIndicator from './FieldTypeIndicator.vue'
import TranslationTableCell from './TranslationTableCell.vue'

interface Props {
  entry: TranslationEntry
  availableLocales: string[]
  index: number
}

interface Emits {
  (e: 'edit', entry: TranslationEntry): void
  (e: 'delete', entry: TranslationEntry): void
  (e: 'restore', entry: TranslationEntry): void
  (e: 'special-edit', entry: TranslationEntry): void
  (e: 'cell-edit', entry: TranslationEntry): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取字段元数据
function getFieldMetadata(entry: TranslationEntry): FieldMetadata {
  return enhancedTranslationService.analyzeField(entry.path, entry.translations.zh)
}

// 获取编辑器提示
function getEditorHints(entry: TranslationEntry): string[] {
  const metadata = getFieldMetadata(entry)
  return enhancedTranslationService.getFieldHints(entry.path, metadata.type)
}

// 获取字段类型图标
function getFieldTypeIcon(type: FieldMetadata['type']): string {
  switch (type) {
    case 'regex': return 'i-lucide-regex'
    case 'meta': return 'i-lucide-code'
    case 'json': return 'i-lucide-braces'
    case 'readonly': return 'i-lucide-lock'
    default: return 'i-lucide-type'
  }
}

// 检查是否需要特殊编辑器
function needsSpecialEditor(metadata: FieldMetadata): boolean {
  return metadata.type !== 'text' || metadata.level !== 'basic'
}

// 处理特殊编辑器
function handleSpecialEdit() {
  emit('special-edit', props.entry)
}

// 处理单元格编辑
function handleCellEdit() {
  emit('cell-edit', props.entry)
}
</script>

<template>
  <TableRow
    v-motion
    :initial="{ opacity: 0, y: 20 }"
    :enter="{ opacity: 1, y: 0, transition: { delay: index * 50 } }"
    :class="{ 'opacity-50': entry.isDeleted }"
    class="transition-colors duration-200 hover:bg-muted/30"
  >
    <!-- 状态列 -->
    <TableCell>
      <div class="flex items-center justify-center">
        <span
          v-if="entry.isDeleted"
          v-motion
          :initial="{ opacity: 0, scale: 0.8 }"
          :enter="{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400 } }"
          class="inline-flex items-center text-xs text-red-600 font-medium"
        >
          <i class="i-lucide-trash-2 mr-1 h-3 w-3" />
          已删除
        </span>
        <span
          v-else-if="entry.isModified"
          v-motion
          :initial="{ opacity: 0, scale: 0.8 }"
          :enter="{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 400 } }"
          class="inline-flex items-center text-xs text-green-600 font-medium"
        >
          <i class="i-lucide-circle-dot mr-1 h-3 w-3 animate-pulse" />
          已修改
        </span>
        <span v-else class="text-xs text-muted-foreground transition-colors duration-200">
          正常
        </span>
      </div>
    </TableCell>

    <!-- 分类列 -->
    <TableCell>
      <span class="rounded bg-muted px-2 py-1 text-xs font-medium">
        {{ entry.category }}
      </span>
    </TableCell>

    <!-- 键名列 -->
    <TableCell class="text-xs font-mono">
      <div class="flex items-center gap-2">
        <FieldTypeIndicator
          :metadata="getFieldMetadata(entry)"
          :hints="getEditorHints(entry)"
        />
        <span>{{ entry.key }}</span>
      </div>
    </TableCell>

    <!-- 翻译列 -->
    <TableCell
      v-for="locale in availableLocales"
      :key="locale"
    >
      <TranslationTableCell
        :entry="entry"
        :locale="locale"
        @edit="handleCellEdit"
      />
    </TableCell>

    <!-- 操作列 -->
    <TableCell>
      <div class="flex items-center gap-1">
        <!-- 特殊编辑器按钮 -->
        <TooltipProvider v-if="needsSpecialEditor(getFieldMetadata(entry))">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="sm"
                :disabled="entry.isDeleted"
                class="transition-transform duration-200 hover:scale-105"
                @click="handleSpecialEdit"
              >
                <i
                  :class="getFieldTypeIcon(getFieldMetadata(entry).type)"
                  class="h-4 w-4"
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>使用专用编辑器 ({{ getFieldMetadata(entry).type.toUpperCase() }})</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <!-- 编辑按钮 -->
        <Button
          variant="ghost"
          size="sm"
          :disabled="entry.isDeleted"
          class="transition-transform duration-200 hover:scale-105"
          @click="$emit('edit', entry)"
        >
          <i class="i-lucide-edit h-4 w-4" />
        </Button>

        <!-- 删除/恢复按钮 -->
        <Button
          v-if="!entry.isDeleted"
          variant="ghost"
          size="sm"
          class="text-red-600 transition-all duration-200 hover:scale-105 hover:text-red-700"
          @click="$emit('delete', entry)"
        >
          <i class="i-lucide-trash-2 h-4 w-4" />
        </Button>

        <Button
          v-else
          variant="ghost"
          size="sm"
          class="text-green-600 transition-all duration-200 hover:scale-105 hover:text-green-700"
          @click="$emit('restore', entry)"
        >
          <i class="i-lucide-undo-2 h-4 w-4" />
        </Button>
      </div>
    </TableCell>
  </TableRow>
</template>
