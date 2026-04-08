<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ExportChange {
  type: 'added' | 'modified' | 'deleted'
  key: string
  oldValue?: string
  newValue?: string
}

interface ExportPreviewItem {
  locale: string
  category: string
  changes: ExportChange[]
}

interface Props {
  open: boolean
  previewData: ExportPreviewItem[]
  getLocaleDisplayName: (locale: string) => string
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'confirm-export'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-h-[80vh] max-w-4xl overflow-hidden">
      <DialogHeader>
        <DialogTitle>导出预览</DialogTitle>
        <DialogDescription>
          以下是即将导出的变更内容。导出的文件将包含该语言的完整翻译。
        </DialogDescription>
      </DialogHeader>

      <div class="custom-scrollbar max-h-[60vh] overflow-y-auto space-y-4">
        <div v-for="item in previewData" :key="`${item.locale}-${item.category}`" class="p-4 border rounded-lg">
          <div class="mb-3 flex gap-2 items-center">
            <h4 class="font-medium">
              {{ getLocaleDisplayName(item.locale) }} - {{ item.category }}
            </h4>
            <span class="text-xs px-2 py-1 border rounded">
              {{ item.changes.length }} 项变更
            </span>
          </div>

          <div class="custom-scrollbar max-h-40 overflow-y-auto space-y-1">
            <div
              v-for="change in item.changes"
              :key="change.key"
              class="text-sm px-3 py-2 border-l-2 rounded flex items-start justify-between hover:bg-muted/30"
              :class="{
                'border-l-green-500': change.type === 'added',
                'border-l-blue-500': change.type === 'modified',
                'border-l-red-500': change.type === 'deleted',
              }"
            >
              <div class="flex-1 min-w-0 space-y-1">
                <div class="text-xs text-muted-foreground font-mono">
                  {{ item.category }}.{{ change.key }}
                </div>
                <div v-if="change.type === 'deleted'" class="text-muted-foreground line-through break-words">
                  {{ change.oldValue }}
                </div>
                <div v-else class="break-words">
                  {{ change.newValue }}
                </div>
                <div v-if="change.type === 'modified' && change.oldValue" class="text-xs text-muted-foreground line-through break-words">
                  {{ change.oldValue }}
                </div>
              </div>
              <div class="ml-3 flex-shrink-0">
                <span class="text-xs px-2 py-1 border rounded">
                  {{ change.type === 'added' ? '新增' : change.type === 'modified' ? '修改' : '删除' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="previewData.length === 0" class="text-muted-foreground py-8 text-center">
          没有检测到变更内容
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="$emit('update:open', false)">
          取消
        </Button>
        <Button :disabled="previewData.length === 0" @click="$emit('confirm-export')">
          <i class="i-lucide-download mr-2 h-4 w-4" />
          确认导出
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
