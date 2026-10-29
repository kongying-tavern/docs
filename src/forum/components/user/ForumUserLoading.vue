<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Skeleton } from '@/components/ui/skeleton'
import AsyncLoadError from '~/components/AsyncLoadError.vue'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import ForumLayout from '../layout/ForumLayout.vue'
import ForumListQuickControls from '../list/ForumListQuickControls.vue'
import ForumTopicListSkeletons from '../list/ForumTopicListSkeletons.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

defineProps<{ error?: Error }>()
const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n({ useScope: 'global' })
const { list } = useForumRoute()
</script>

<template>
  <ForumLayout>
    <template #header>
      <AsyncLoadError v-if="error" @retry="emit('retry')" />
      <template v-else>
        <span class="sr-only" role="status">{{ t('ui.button.loading') }}</span>
        <ForumUserProfileHeaderSkeleton data-async-loading aria-busy="true" />
      </template>
    </template>
    <template v-if="!error" #content>
      <div aria-hidden="true">
        <ForumListQuickControls
          inert
          class="user-controls-skeleton motion-safe:animate-pulse"
          :sort="list?.sort ?? 'created'"
          :topic-type="list?.topicType ?? 'all'"
        />
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

<style scoped>
.user-controls-skeleton :deep(button) {
  @apply bg-primary/10;
  color: transparent;
}

.user-controls-skeleton :deep(button > *) {
  visibility: hidden;
}

html[data-reduced-motion='true'] .user-controls-skeleton {
  animation: none;
}
</style>
