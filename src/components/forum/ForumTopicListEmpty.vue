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
import { useLocalized } from '@/hooks/useLocalized'
import OpenFeedbackFormButton from './OpenFeedbackFormButton.vue'

defineProps<{
  error?: boolean
  refreshData?: () => Promise<unknown> | unknown
}>()

const { message } = useLocalized()
</script>

<template>
  <Empty class="border-none">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Info />
      </EmptyMedia>
      <EmptyTitle>
        {{ error ? message.forum.loadError : message.forum.empty.title }}
      </EmptyTitle>
      <EmptyDescription>
        {{ error ? message.forum.errors.cannotLoadData : message.forum.empty.description }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <div class="flex gap-2">
        <OpenFeedbackFormButton v-if="!error" />

        <Button
          v-if="refreshData"
          variant="outline"
          @click="refreshData()"
        >
          {{ message.forum.auth.callback.error.retry }}
        </Button>
      </div>
    </EmptyContent>
  </Empty>
</template>
