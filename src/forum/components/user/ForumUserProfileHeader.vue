<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useUserProfile } from './composables/useUserProfile'
import ForumFollowUserButton from './ForumFollowUserButton.vue'
import ForumUserProfilePanel from './ForumUserProfilePanel.vue'

const props = defineProps<{ username: string, topicCount: number, suggestions?: ForumAPI.Topic[] }>()
const activeTab = defineModel<'all' | 'closed'>('activeTab', { default: 'all' })
const { list, openSearch, openSearchWithQuery } = useForumRoute()
const { renderedUser, role, isAuthorizedUser, menu, sendMessage } = useUserProfile(() => props.username)
</script>

<template>
  <ForumUserProfilePanel
    v-model:active-tab="activeTab" v-bind="props"
    :rendered-user="renderedUser" :role="role" :is-authorized-user="isAuthorizedUser"
    :menu="menu" :query="list?.q ?? ''"
    @message="sendMessage" @search="openSearchWithQuery" @open-search="openSearch"
  >
    <template v-if="renderedUser?.login" #follow="{ textClass }">
      <ForumFollowUserButton :key="renderedUser.login" :user="renderedUser.login" :text-class="textClass" />
    </template>
  </ForumUserProfilePanel>
</template>
