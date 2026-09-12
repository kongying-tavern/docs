<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'

const props = defineProps<{
  user: ForumAPI.User
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
      v-if="official"
      :href="officialHref"
      target="_blank"
      rel="noopener"
      class="text-[var(--forum-role-official-at)] font-semibold shrink-0 hover:underline"
    >
      {{ message.forum.topic.officialAt }}
    </a>
    <a :href="userHref(user.login)" :data-forum-user="user.login" data-forum-user-name class="truncate hover:underline">
      @{{ user.login }}
    </a>
  </span>
</template>
