<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useTopicStatusMenu } from '~/forum/composables/state/useTopicStatusMenu'
import ForumTopicPropertyMenu from '../ui/ForumTopicPropertyMenu.vue'

const { topic } = defineProps<{ topic: ForumAPI.Topic }>()
const { message } = useLocalized()
const { hasAllPermissions } = useRuleChecks()
const canManageStatus = hasAllPermissions('manage_feedback', 'edit_feedback')
const { items, updatingTopic } = useTopicStatusMenu(() => topic, message)
</script>

<template>
  <ForumTopicPropertyMenu
    v-if="topic.status && canManageStatus"
    :items="items"
    :label="message.forum.topic.status[topic.status]"
    :title="message.forum.topic.menu.modifyStatus.text"
    :disabled="updatingTopic"
  />
</template>
