<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Button } from '@/components/ui/button'
import { ref } from 'vue'
import { useFollowUser } from '~/composables/useFollowUser'

const { user } = defineProps<{
  user: string
  textClass?: HTMLAttributes['class']
}>()

const { followState, toggleFollowThisUser, following, disabled } = useFollowUser(user)
const isHovered = ref(false)
</script>

<template>
  <Button
    v-if="!disabled"
    :loading="following"
    :disabled="following"
    :variant="followState ? 'ghost' : 'default'"
    class="flex items-center gap-1 rounded-full transition"
    :class="{ 'hover:c-red hover:border-red': followState }"
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
      {{ followState ? (isHovered ? '取消关注' : '正在关注中') : '关注' }}
    </span>
  </Button>
</template>
