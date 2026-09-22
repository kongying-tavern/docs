<script setup lang="ts">
import { Info } from '@lucide/vue'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

defineProps<{
  /** 悬停提示正文，同时作为图标对读屏器的名称 */
  label: string
}>()
</script>

<template>
  <HoverCard>
    <HoverCardTrigger as-child>
      <!-- 图标是 display:block 的 svg，需用 inline-flex 包一层才不会另起一行 -->
      <span
        class="text-muted-foreground align-middle inline-flex items-center"
        role="img"
        :aria-label="label"
      >
        <Info class="size-3.5" />
      </span>
    </HoverCardTrigger>
    <!-- SelectContent / DropdownMenuContent 同为 z-50，提示层需再高一层才能盖住浮层内容 -->
    <HoverCardContent class="text-xs p-2 max-w-48 w-fit z-[60]">
      {{ label }}
    </HoverCardContent>
  </HoverCard>
</template>
