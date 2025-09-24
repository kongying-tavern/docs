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

      <div class="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
        <div v-for="item in previewData" :key="`${item.locale}-${item.category}`" class="border rounded-lg p-4">
          <div class="mb-3 flex items-center gap-2">
            <h4 class="font-medium">
              {{ getLocaleDisplayName(item.locale) }} - {{ item.category }}
            </h4>
            <span class="border rounded px-2 py-1 text-xs">
              {{ item.changes.length }} 项变更
            </span>
          </div>

          <div class="max-h-40 overflow-y-auto custom-scrollbar space-y-1">
            <div
              v-for="change in item.changes"
              :key="change.key"
              class="flex items-start justify-between border-l-2 rounded px-3 py-2 text-sm hover:bg-muted/30"
              :class="{
                'border-l-green-500': change.type === 'added',
                'border-l-blue-500': change.type === 'modified',
                'border-l-red-500': change.type === 'deleted',
              }"
            >
              <div class="min-w-0 flex-1 space-y-1">
                <div class="text-xs text-muted-foreground font-mono">
                  {{ item.category }}.{{ change.key }}
                </div>
                <div v-if="change.type === 'deleted'" class="break-words text-muted-foreground line-through">
                  {{ change.oldValue }}
                </div>
                <div v-else class="break-words">
                  {{ change.newValue }}
                </div>
                <div v-if="change.type === 'modified' && change.oldValue" class="break-words text-xs text-muted-foreground line-through">
                  {{ change.oldValue }}
                </div>
              </div>
              <div class="ml-3 flex-shrink-0">
                <span class="border rounded px-2 py-1 text-xs">
                  {{ change.type === 'added' ? '新增' : change.type === 'modified' ? '修改' : '删除' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="previewData.length === 0" class="py-8 text-center text-muted-foreground">
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
