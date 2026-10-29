<script setup lang="ts">
import type { ForumFilter } from '~/forum/services/forumRoute'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForumListControlOptions } from '~/forum/composables/view/useForumListControlOptions'
import ForumPillSelect from './ForumPillSelect.vue'

const props = defineProps<{
  filter: ForumFilter
}>()
const emit = defineEmits<{ change: [filter: ForumFilter] }>()

const { t } = useI18n({ useScope: 'global' })
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
      :label="t('forum.header.navigation.groups.status')"
      :options="options"
    />
  </div>
</template>
