<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import OpenFeedbackFormButton from './OpenFeedbackFormButton.vue'

defineProps<{
  refreshData?: () => void
}>()
</script>

<template>
  <Empty class="border-none">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Info />
      </EmptyMedia>
      <EmptyTitle>暂未获取到相关反馈数据</EmptyTitle>
      <EmptyDescription>
        当前暂未获取到相关反馈数据，你可以尝试调整筛选条件，或者提交新的反馈。
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <div class="flex gap-2">
        <OpenFeedbackFormButton />

        <Button
          v-if="refreshData"
          variant="outline"
          @click="refreshData()"
        >
          刷新数据
        </Button>
      </div>
    </EmptyContent>
  </Empty>
</template>
