<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'

import Avatar from '@/components/ui/Avatar.vue'
import Button from '@/components/ui/button/Button.vue'

const { user } = defineProps<{
  user: ForumAPI.User
}>()

function handleClick() {
  window.open(`https://gitee.com/${user.login}`)
}
</script>

<template>
  <Button variant="ghost" @click="handleClick">
    <Avatar size="sm" :src="user.avatar" />
    <div class="w-fit text-left">
      <span
        class="block c-[var(--vp-c-text-1)] font-medium lh-4 font-[var(--vp-font-family-subtitle)]"
      >
        {{ user.username }}
      </span>
      <span class="c-[var(--vp-c-text-3)] font-[var(--vp-font-family-content)]">
        @{{ user.login }}
      </span>
    </div>
  </Button>
</template>
