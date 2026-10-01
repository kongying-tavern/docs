<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useTopicTypeMenu } from '~/forum/composables/state/useTopicTypeMenu'
import ForumTopicPropertyMenu from '../ui/ForumTopicPropertyMenu.vue'

const { topic } = defineProps<{ topic: ForumAPI.Topic }>()
const { message } = useLocalized()
const { items, canManage, updatingTopic } = useTopicTypeMenu(() => topic, message)
const label = computed(() => message.value.forum.topic.type[topic.type.toLowerCase() as keyof typeof message.value.forum.topic.type])
</script>

<template>
  <ForumTopicPropertyMenu
    v-if="canManage && !topic.status && !topic.goodIssue"
    :items="items"
    :label="label"
    :title="message.forum.topic.menu.changeType.text"
    :disabled="updatingTopic"
  >
    <slot>{{ label }}</slot>
  </ForumTopicPropertyMenu>
</template>
