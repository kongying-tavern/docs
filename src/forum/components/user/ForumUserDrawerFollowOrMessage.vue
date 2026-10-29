<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { getGiteeMessagesHref } from '~/constants/site'
import { useFollowUser } from '~/forum/composables/data/useFollowUser'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

const { user } = defineProps<{
  user: ForumAPI.User
}>()

const { t } = useI18n({ useScope: 'global' })
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
    <span>{{ t('forum.labels.privateMessage') }}</span>
  </Button>
  <Button
    v-else
    :loading="following"
    :disabled="following"
    @click="toggleFollowThisUser"
  >
    <span class="i-lucide-user-plus text-base mr-1" />
    <span>{{ t('forum.labels.follow') }}</span>
  </Button>
</template>
