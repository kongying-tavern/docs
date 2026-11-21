<script setup lang="ts">
import type ForumAPI from '@/src/forum/api/types.d.ts'
import { Button } from '@theme/components/ui/button/index.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGiteeMessagesHref } from '@/src/constants/site.ts'
import { useFollowUser } from '@/src/forum/composables/data/useFollowUser.ts'
import { useUserInfoStore } from '@/src/forum/stores/auth/useUserInfo.ts'

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
