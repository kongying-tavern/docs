<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import User from '@/components/ui/User.vue'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumTime from '../ui/ForumTime.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'

interface Props {
  topic: ForumAPI.Topic | ForumAPI.Post
  topicAuthorId?: string | number
  menu?: FORUM.TopicDropdownMenu[]
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => [],
})

const { isOfficial } = useRuleChecks()
const { userHref } = useForumRoute()

// Computed properties
const role = computed(() => {
  if (props.topicAuthorId === props.topic.user.id) {
    return 'author'
  }
  if (isOfficial(props.topic.user.id).value) {
    return 'official'
  }
  return null
})
</script>

<template>
  <div class="topic-header font-size-5 font-[var(--vp-font-family-title)] flex break-words justify-between">
    <div class="text-12 flex flex-wrap gap-[0.25rem] min-w-0 items-center relative">
      <ForumUserHoverCard :user="topic.user">
        <template #trigger>
          <User
            class="cursor-pointer"
            size="xs"
            :name="topic.user.username"
            :to="userHref(topic.user.login)"
            :avatar="{ src: topic.user.avatar, alt: topic.user.login }"
          />
        </template>
      </ForumUserHoverCard>

      <ForumRoleBadge v-if="role === 'official'" :type="role" />

      <span class="text-xs color-[--vp-c-text-3] my-0 inline-block">•</span>

      <ForumTime
        class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
        :date="topic.createdAt"
      />
    </div>

    <ForumTopicDropdownMenu
      :topic-data="topic"
      :menu="menu"
    />
  </div>
</template>

<style scoped>
.topic-header .cursor-pointer:hover {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}
</style>
