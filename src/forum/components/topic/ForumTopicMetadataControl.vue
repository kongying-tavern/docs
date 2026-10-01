<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import ForumTopicMetadata from '../ui/ForumTopicMetadata.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import ForumTopicStatusControl from './ForumTopicStatusControl.vue'
import ForumTopicTypeControl from './ForumTopicTypeControl.vue'

defineProps<{
  type: ForumAPI.TopicType
  state?: ForumAPI.TopicState
  status?: ForumAPI.TopicStatus
  topicId?: string | number
  topic?: ForumAPI.Topic
  goodIssue?: boolean
  iconOnly?: boolean
  interactive?: boolean
}>()
const { hasAllPermissions, hasAnyPermissions } = useRuleChecks()
const canManageStatus = hasAllPermissions('manage_feedback', 'edit_feedback')
const canManageType = hasAnyPermissions('manage_feedback')
const { addSearchFacet, navigateType } = useForumRoute()
</script>

<template>
  <ForumTopicMetadata :type="type" :state="state" :status="status" :topic-id="topicId" :good-issue="goodIssue" :icon-only="iconOnly" :interactive="interactive" @filter-type="navigateType($event, true)" @filter-status="addSearchFacet('state', $event)">
    <template v-if="interactive && !iconOnly && topic && !status && !goodIssue && canManageType" #type>
      <ForumTopicTypeControl :topic="topic">
        <ForumTopicTypeBadge :type="type" />
      </ForumTopicTypeControl>
    </template>
    <template v-if="interactive && topic && status && canManageStatus" #status>
      <ForumTopicStatusControl :topic="topic" />
    </template>
  </ForumTopicMetadata>
</template>
