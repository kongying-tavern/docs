<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useMediaQuery } from '@vueuse/core'
import { useRouter } from 'vitepress'
import { computed, ref } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useLocalized } from '@/hooks/useLocalized'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { useForumUserProfileQuery } from '~/composables/forum/useForumQueries'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { getGiteeMessagesHref } from '~/constants/site'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/services/forum/forumConfig'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumFollowUserButton from './ForumFollowUserButton.vue'
import ForumUserMobileDrawer from './ForumUserMobileDrawer.vue'

const { user, userId } = defineProps<{
  user?: ForumAPI.User
  userId?: string
}>()

if (!user && !userId)
  throw new Error('Must contain any of the two parameters')

const { message } = useLocalized()
const router = useRouter()
const { route, userHref } = useForumRoute()
const currentUser = useUserInfoStore()

const { data: userData, isLoading: getUserLoading } = useForumUserProfileQuery(
  computed(() => user ? '' : userId ?? ''),
)
const userInfo = computed(() => user ?? userData.value ?? null)

const { isOfficial } = useRuleChecks()
const role = computed(() => (isOfficial(userInfo.value?.id || 0).value ? 'official' : null))
const isAuthorizedUser = computed(() => Boolean(
  userInfo.value?.id
  && String(userInfo.value.id) === String(currentUser.info?.id),
))
const href = computed(() => userHref(userInfo.value?.login || ''))

const isOnProfilePage = computed(() => {
  const current = route.value
  return current?.name === 'user' && current.username === userInfo.value?.login
})

const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const drawerOpen = ref(false)

function onTriggerClick(event: MouseEvent) {
  if (isMobile.value) {
    event.preventDefault()
    drawerOpen.value = true
    return
  }
  if (isOnProfilePage.value)
    return
  router.go(href.value)
}

function sendMessage() {
  window.open(getGiteeMessagesHref(userInfo.value!.id), String(userInfo.value?.id))
}
</script>

<template>
  <HoverCard>
    <HoverCardTrigger
      as-child
      @click="onTriggerClick"
    >
      <slot name="trigger" />
    </HoverCardTrigger>
    <HoverCardContent
      v-if="!isMobile"
      align="end"
      class="p-4 w-72"
    >
      <div class="flex flex-col gap-3">
        <div class="flex gap-3 items-start">
          <Avatar
            :data-forum-user="userInfo?.login"
            :src="userInfo?.avatar"
            :alt="userInfo?.username"
            class="h-12 w-12"
            img-class="size-full rounded-full object-cover"
          />

          <div class="flex-1">
            <div class="flex gap-2 items-center">
              <a
                :href="href"
                :data-forum-user="userInfo?.login"
                :alt="userInfo?.username"
              >
                <h3 class="text-base text-[var(--vp-c-text-1)] font-bold">
                  {{ userInfo?.username || 'Unknown' }}
                </h3>
              </a>
              <span
                v-if="role"
                class="rounded-full"
              >
                <ForumRoleBadge :type="role" />
              </span>
            </div>

            <p class="text-xs text-gray-600 mt-1 line-clamp-2 dark:text-gray-400">
              {{ userInfo?.bio || message.forum.labels.lazyPerson }}
            </p>
          </div>
        </div>

        <div v-if="!isAuthorizedUser" class="mt-1 flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            class="border border-[var(--vp-c-divider)] border-solid"
            :disabled="getUserLoading"
            @click="sendMessage"
          >
            <span class="i-lucide-mail text-sm mr-1" />
            <span>{{ message.forum.labels.privateMessage }}</span>
          </Button>
          <ForumFollowUserButton
            v-if="userInfo?.login"
            size="sm"
            class="border border-[var(--vp-c-divider)] rounded-md border-solid"
            :user="userInfo?.login"
          />
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>

  <ForumUserMobileDrawer
    v-if="isMobile"
    v-model:open="drawerOpen"
    :user="userInfo"
    :hide-profile-button="isOnProfilePage"
  />
</template>
