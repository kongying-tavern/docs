<template>
  <Button variant="ghost" @click="handleClick">
    <Avatar size="sm" :src="user.avatar" />
    <div class="text-left w-fit">
      <span
        class="font-medium block c-[var(--vp-c-text-1)] lh-4 font-[var(--vp-font-family-subtitle)]"
      >
        {{ user.username }}
      </span>
      <span class="c-[var(--vp-c-text-3)] font-[var(--vp-font-family-content)]">
        @{{ user.login }}
      </span>
    </div>
  </Button>
</template>

<script setup lang="ts">
import Button from '@/components/ui/button/Button.vue'
import type ForumAPI from '@/apis/forum/api'
import Avatar from '@/components/ui/Avatar.vue'

const { user } = defineProps<{
  user: ForumAPI.User
}>()

const handleClick = () => {
  window.open(`https://gitee.com/${user.login}`)
}
</script>
