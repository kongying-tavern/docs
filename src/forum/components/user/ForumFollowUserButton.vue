<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useFollowUser } from '@/src/forum/composables/data/useFollowUser.ts'
import ForumFollowUserControl from './ForumFollowUserControl.vue'

const { user, textClass } = defineProps<{ user: string, textClass?: HTMLAttributes['class'] }>()
const { followState, toggleFollowThisUser, following, disabled } = useFollowUser(user)
</script>

<template>
  <ForumFollowUserControl :follow-state="followState" :following="following" :disabled="disabled" :text-class="textClass" @toggle="toggleFollowThisUser" />
</template>
