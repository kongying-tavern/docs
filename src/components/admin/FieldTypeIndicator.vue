<script setup lang="ts">
import type { FieldMetadata } from '~/services/enhancedTranslationService'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface Props {
  metadata: FieldMetadata
  hints: string[]
}

defineProps<Props>()

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

// 获取字段类型颜色
function getFieldTypeColor(type: FieldMetadata['type']): string {
  switch (type) {
    case 'regex': return 'text-purple-600'
    case 'meta': return 'text-blue-600'
    case 'json': return 'text-orange-600'
    case 'readonly': return 'text-gray-500'
    default: return 'text-green-600'
  }
}
</script>

<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <i
          :class="[getFieldTypeIcon(metadata.type), getFieldTypeColor(metadata.type)]"
          class="h-3 w-3"
        />
      </TooltipTrigger>
      <TooltipContent>
        <div class="space-y-1">
          <p class="font-medium">
            {{ metadata.type.toUpperCase() }}
          </p>
          <p class="text-xs text-muted-foreground">
            {{ metadata.description }}
          </p>
          <div v-if="hints.length > 0" class="text-xs space-y-1">
            <p class="font-medium">
              提示:
            </p>
            <ul class="list-disc list-inside space-y-0.5">
              <li v-for="hint in hints" :key="hint">
                {{ hint }}
              </li>
            </ul>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
