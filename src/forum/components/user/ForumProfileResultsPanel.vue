<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { ref, watch } from 'vue'
import ForumTopicResults from '../list/ForumTopicResults.vue'

const props = defineProps<{
  activeTab: 'all' | 'closed'
  data: ForumAPI.Topic[]
  loading?: boolean
  loadingMore?: boolean
  error?: Error | null
  canLoadMore?: boolean
  loadMore?: () => Promise<unknown> | unknown
  refreshData?: () => Promise<unknown> | unknown
  query?: string
  sort?: ForumAPI.SortMethod
  text?: string
}>()
const emit = defineEmits<{ login: [] }>()
const tabDirection = ref<'back' | 'forward'>('forward')
watch(() => props.activeTab, (next, previous) => {
  tabDirection.value = next === 'closed' && previous === 'all' ? 'forward' : 'back'
})
</script>

<template>
  <div class="profile-tab-panel" :data-direction="tabDirection">
    <Transition name="profile-tab" mode="out-in">
      <ForumTopicResults :key="activeTab" v-bind="props" @login="emit('login')" />
    </Transition>
  </div>
</template>

<style scoped>
.profile-tab-panel {
  display: grid;
  overflow: clip;
}

.profile-tab-panel > * {
  grid-area: 1 / 1;
  min-width: 0;
}

.profile-tab-enter-active {
  transition:
    transform 300ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 210ms cubic-bezier(0.33, 1, 0.68, 1) 90ms;
}

.profile-tab-leave-active {
  transition:
    transform 300ms cubic-bezier(0.32, 0.72, 0, 1),
    opacity 150ms cubic-bezier(0.33, 1, 0.68, 1);
}

.profile-tab-panel[data-direction='forward'] .profile-tab-enter-from,
.profile-tab-panel[data-direction='back'] .profile-tab-leave-to {
  transform: translateX(48px);
  opacity: 0;
}

.profile-tab-panel[data-direction='forward'] .profile-tab-leave-to,
.profile-tab-panel[data-direction='back'] .profile-tab-enter-from {
  transform: translateX(-48px);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .profile-tab-enter-active,
  .profile-tab-leave-active {
    transition: opacity 120ms ease;
  }

  .profile-tab-enter-from,
  .profile-tab-leave-to {
    transform: none !important;
    opacity: 0;
  }
}
</style>
