<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTopicTypeMenu } from '~/forum/composables/state/useTopicTypeMenu'
import ForumTopicPropertyMenu from '../ui/ForumTopicPropertyMenu.vue'

const { topic } = defineProps<{ topic: ForumAPI.Topic }>()
const { t } = useI18n({ useScope: 'global' })
const { items, canManage, updatingTopic } = useTopicTypeMenu(() => topic, t)
const label = computed(() => t(`forum.topic.type.${topic.type.toLowerCase()}`))
</script>

<template>
  <ForumTopicPropertyMenu
    v-if="canManage && !topic.status && !topic.goodIssue"
    :items="items"
    :label="label"
    :title="t('forum.topic.menu.changeType.text')"
    :disabled="updatingTopic"
  >
    <slot>{{ label }}</slot>
  </ForumTopicPropertyMenu>
</template>
