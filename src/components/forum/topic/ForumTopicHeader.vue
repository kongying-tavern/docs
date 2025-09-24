<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from './types'
import User from '@/components/ui/User.vue'
import { computed } from 'vue'
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

interface Emits {
  (e: 'user:click', user: ForumAPI.User): void
  (e: 'menu:action', actionId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  menu: () => [],
})

const emit = defineEmits<Emits>()

const { isOfficial } = useRuleChecks()

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

// Event handlers
function handleUserClick(): void {
  emit('user:click', props.topic.user)
}

function handleMenuAction(actionId: string): void {
  emit('menu:action', actionId)
}
</script>

<template>
  <div class="topic-header flex justify-between break-words font-size-5 font-[var(--vp-font-family-title)]">
    <div class="relative min-w-0 flex flex-wrap items-center gap-[0.25rem] text-12">
      <ForumUserHoverCard :user="topic.user">
        <template #trigger>
          <User
            class="cursor-pointer"
            size="xs"
            :name="topic.user.username"
            :to="`./user/${topic.user.login}`"
            :avatar="{ src: topic.user.avatar, alt: topic.user.login }"
            @click="handleUserClick"
          />
        </template>
      </ForumUserHoverCard>

      <ForumRoleBadge v-if="role === 'official'" :type="role" />

      <span class="my-0 inline-block text-xs color-[--vp-c-text-3]">•</span>

      <ForumTime
        class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
        :date="topic.createdAt"
      />
    </div>

    <ForumTopicDropdownMenu
      :topic-data="topic"
      :menu="menu"
      @menu:action="handleMenuAction"
    />
  </div>
</template>

<style scoped>
.topic-header .cursor-pointer:hover {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}
</style>
