<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { useRuleChecks } from '~/forum/composables/useRuleChecks'

const props = defineProps<{
  user: ForumAPI.User
  interactive?: boolean
}>()

const { message } = useLocalized()
const { isOfficial } = useRuleChecks()
const { userHref } = useForumRoute()

const official = computed(() => isOfficial(props.user.id).value)
const officialHref = 'https://github.com/kongying-tavern/'
</script>

<template>
  <span
    data-forum-shared-topic="login"
    class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)] inline-flex gap-1 min-w-0 whitespace-nowrap items-center"
  >
    <a
      v-if="official && interactive !== false"
      :href="officialHref"
      target="_blank"
      rel="noopener"
      class="text-[var(--forum-role-official-at)] font-semibold shrink-0 hover:underline"
    >
      {{ message.forum.topic.officialAt }}
    </a>
    <span v-else-if="official" class="text-[var(--forum-role-official-at)] font-semibold shrink-0">
      {{ message.forum.topic.officialAt }}
    </span>
    <a v-if="interactive !== false" :href="userHref(user.login)" :data-forum-user="user.login" data-forum-user-name class="truncate hover:underline">
      @{{ user.login }}
    </a>
    <span v-else :data-forum-user="user.login" data-forum-user-name class="truncate">
      @{{ user.login }}
    </span>
  </span>
</template>
