<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useFollowUser } from '~/forum/composables/useFollowUser'

const { user } = defineProps<{
  user: string
  textClass?: HTMLAttributes['class']
}>()

const { followState, toggleFollowThisUser, following, disabled } = useFollowUser(user)
const { message } = useLocalized()
const isHovered = ref(false)
</script>

<template>
  <Button
    v-if="!disabled"
    :loading="following"
    :disabled="following"
    :variant="followState ? 'ghost' : 'default'"
    class="flex gap-1 transition items-center"
    :class="{ 'hover:c-[var(--vp-c-danger-1)] hover:border-[var(--vp-c-danger-1)]': followState }"
    @click="toggleFollowThisUser"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <span
      class="text-base" :class="[
        followState ? '' : 'i-lucide:user-plus',
      ]"
    />
    <span :class="textClass">
      {{ followState ? (isHovered ? message.forum.labels.unfollow : message.forum.labels.following) : message.forum.labels.follow }}
    </span>
  </Button>
</template>
