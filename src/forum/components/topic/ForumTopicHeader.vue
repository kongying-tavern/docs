<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '~/forum/api/types'
import User from '@/components/ui/User.vue'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import ForumTime from '../ui/ForumTime.vue'
import ForumUserAtTag from '../user/ForumUserAtTag.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import ForumTopicDropdownMenu from './ForumTopicDropdownMenu.vue'

interface Props {
  topic: ForumAPI.Topic | ForumAPI.Post
  menu?: FORUM.TopicDropdownMenu[]
  showMenu?: boolean
  interactive?: boolean
}

withDefaults(defineProps<Props>(), {
  menu: () => [],
  showMenu: true,
  interactive: true,
})

const { userHref } = useForumRoute()
</script>

<template>
  <div class="topic-header font-size-5 font-[var(--vp-font-family-title)] flex gap-2 break-words justify-between">
    <div class="text-12 flex flex-wrap gap-[0.25rem] min-w-0 items-center relative">
      <ForumUserHoverCard v-if="interactive" :user="topic.user">
        <template #trigger>
          <User
            class="cursor-pointer"
            :data-forum-user="topic.user.login"
            data-forum-shared-topic="author"
            size="xs"
            :name="topic.user.username"
            :to="userHref(topic.user.login)"
            :avatar="{ src: topic.user.avatar, alt: topic.user.login }"
          />
        </template>
      </ForumUserHoverCard>

      <User
        v-else
        :data-forum-user="topic.user.login"
        data-forum-shared-topic="author"
        size="xs"
        :name="topic.user.username"
        :avatar="{ src: topic.user.avatar, alt: topic.user.login }"
      />

      <ForumUserAtTag :user="topic.user" :interactive="interactive" />
    </div>

    <div class="flex shrink-0 gap-2 items-center">
      <ForumTime
        class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)] whitespace-nowrap"
        :date="topic.createdAt"
        :toggleable="interactive"
      />
      <ForumTopicDropdownMenu
        v-if="showMenu"
        :topic-data="topic"
        :menu="menu"
      />
    </div>
  </div>
</template>

<style scoped>
.topic-header .cursor-pointer {
  transition: opacity 0.2s ease;
}

/* 触屏点按后悬停态会残留，仅在真悬停设备生效 */
@media (hover: hover) {
  .topic-header .cursor-pointer:hover {
    opacity: 0.8;
  }
}
</style>
