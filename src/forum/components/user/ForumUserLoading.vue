<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
import { useLocalized } from '@/hooks/useLocalized'
import AsyncLoadError from '~/components/AsyncLoadError.vue'
import ForumLayout from '../layout/ForumLayout.vue'
import ForumTopicListSkeletons from '../list/ForumTopicListSkeletons.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

defineProps<{ error?: Error }>()
const emit = defineEmits<{ retry: [] }>()
const { message } = useLocalized()
</script>

<template>
  <ForumLayout>
    <template #header>
      <AsyncLoadError v-if="error" @retry="emit('retry')" />
      <template v-else>
        <span class="sr-only" role="status">{{ message.ui.button.loading }}</span>
        <ForumUserProfileHeaderSkeleton data-async-loading aria-busy="true" />
      </template>
    </template>
    <template v-if="!error" #content>
      <div aria-hidden="true">
        <div class="pb-3 flex gap-2 h-13 min-w-0 items-center">
          <div class="py-1 flex gap-2 min-w-0 overflow-hidden">
            <Skeleton v-for="item in 4" :key="item" class="rounded-md shrink-0 h-8 w-20" />
          </div>
          <Skeleton class="ml-auto rounded-md shrink-0 size-8" />
        </div>
        <ForumTopicListSkeletons />
      </div>
    </template>
    <template v-if="!error" #aside>
      <div class="space-y-7" aria-hidden="true">
        <div v-for="section in 2" :key="section" class="space-y-3">
          <Skeleton class="h-6 w-24" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-4 w-2/3" />
        </div>
      </div>
    </template>
  </ForumLayout>
</template>
