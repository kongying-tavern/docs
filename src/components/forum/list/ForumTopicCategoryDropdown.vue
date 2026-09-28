<script setup lang="ts">
import type { ForumTopicType } from '~/forum/services/forumRoute'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumListControlOptions } from '~/composables/forum/useForumListControlOptions'
import ForumPillSelect from './ForumPillSelect.vue'

const props = defineProps<{ topicType: ForumTopicType }>()
const emit = defineEmits<{ change: [topicType: ForumTopicType] }>()
const { message } = useLocalized()

const { types: options } = useForumListControlOptions()
const value = computed<ForumTopicType>({
  get: () => props.topicType,
  set: next => emit('change', next),
})
const currentLabel = computed(() => options.value.find(option => option.id === value.value)?.label ?? options.value[0].label)
</script>

<template>
  <ForumPillSelect
    v-model="value"
    :label="message.forum.header.navigation.groups.type"
    :options="options"
    :aria-label="`${message.forum.header.navigation.groups.type}：${currentLabel}`"
  />
</template>
