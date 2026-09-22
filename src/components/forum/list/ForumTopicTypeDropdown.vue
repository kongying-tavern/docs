<script setup lang="ts">
import type { ForumFilter } from '~/services/forum/forumRoute'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumListControlOptions } from '~/composables/forum/useForumListControlOptions'
import ForumPillSelect from './ForumPillSelect.vue'

const props = defineProps<{
  filter: ForumFilter
}>()
const emit = defineEmits<{ change: [filter: ForumFilter] }>()

const { message } = useLocalized()
const { filters: options } = useForumListControlOptions()

const filter = computed<ForumFilter>({
  get: () => props.filter,
  set: next => emit('change', next),
})
</script>

<template>
  <div class="flex gap-4 items-center">
    <ForumPillSelect
      v-model="filter"
      :label="message.forum.header.navigation.groups.status"
      :options="options"
    />
  </div>
</template>
