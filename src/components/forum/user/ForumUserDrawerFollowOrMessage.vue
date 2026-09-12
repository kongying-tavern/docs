<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useFollowUser } from '~/composables/useFollowUser'
import { getGiteeMessagesHref } from '~/constants/site'

const { user } = defineProps<{
  user: ForumAPI.User
}>()

const { message } = useLocalized()
const currentUser = useUserInfoStore()

const isLoggedIn = computed(() => Boolean(currentUser.info))
const { followState, toggleFollowThisUser, following } = useFollowUser(user.login)
const showMessage = computed(() => !isLoggedIn.value || followState.value === true)

function sendMessage() {
  window.open(getGiteeMessagesHref(user.id), String(user.id))
}
</script>

<template>
  <Button
    v-if="showMessage"
    class="border border-[var(--vp-c-divider)] border-solid"
    @click="sendMessage"
  >
    <span class="i-lucide-mail text-sm mr-1" />
    <span>{{ message.forum.labels.privateMessage }}</span>
  </Button>
  <Button
    v-else
    :loading="following"
    :disabled="following"
    @click="toggleFollowThisUser"
  >
    <span class="i-lucide-user-plus text-base mr-1" />
    <span>{{ message.forum.labels.follow }}</span>
  </Button>
</template>
