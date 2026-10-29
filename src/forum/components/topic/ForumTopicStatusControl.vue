<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useI18n } from 'vue-i18n'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useTopicStatusMenu } from '~/forum/composables/state/useTopicStatusMenu'
import ForumTopicPropertyMenu from '../ui/ForumTopicPropertyMenu.vue'

const { topic } = defineProps<{ topic: ForumAPI.Topic }>()
const { t } = useI18n({ useScope: 'global' })
const { hasAllPermissions } = useRuleChecks()
const canManageStatus = hasAllPermissions('manage_feedback', 'edit_feedback')
const { items, updatingTopic } = useTopicStatusMenu(() => topic, t)
</script>

<template>
  <ForumTopicPropertyMenu
    v-if="topic.status && canManageStatus"
    :items="items"
    :label="t(`forum.topic.status.${topic.status}`)"
    :title="t('forum.topic.menu.modifyStatus.text')"
    :disabled="updatingTopic"
  />
</template>
