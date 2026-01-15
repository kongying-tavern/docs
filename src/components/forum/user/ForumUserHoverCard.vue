<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useData, withBase } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { user as userAPI } from '@/apis/forum/gitee'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { useRuleChecks } from '~/composables/useRuleChecks'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumFollowUserButton from './ForumFollowUserButton.vue'

const { user, userId } = defineProps<{
  user?: ForumAPI.User
  userId?: string
}>()

if (!user && !userId)
  throw new Error('Must contain any of the two parameters')

const { localeIndex } = useData()
const { message } = useLocalized()

const { run: getUser, data: userData, loading: getUserLoading } = useRequest(userAPI.getUser, {
  manual: true,
  onError: (error) => {
    toast.error(`${message.value.forum.labels.fetchUserFailed} (${error})`)
  },
})

const userInfo = ref<ForumAPI.User | null>(user || null)

if (!user && userId) {
  getUser(userId)
}

watch(userData, (newVal) => {
  if (newVal)
    userInfo.value = newVal
})

const { isOfficial } = useRuleChecks()
const role = computed(() => (isOfficial(userInfo.value?.id || 0).value ? 'official' : null))
const href = computed(() => withBase(`${getLangPath(localeIndex.value)}feedback/user/${userInfo.value?.login}`))

function openUserProfilePage() {
  window.open(href.value, userInfo.value?.login)
}

function sendMessage() {
  window.open(`https://gitee.com/notifications/messages/${userInfo.value?.id}`, String(userInfo.value?.id))
}
</script>

<template>
  <HoverCard>
    <HoverCardTrigger
      as-child
      @click="openUserProfilePage"
    >
      <slot name="trigger" />
    </HoverCardTrigger>
    <HoverCardContent
      align="end"
      class="p-4 w-72"
    >
      <div class="flex flex-col gap-3">
        <!-- 用户信息头部 -->
        <div class="flex gap-3 items-start">
          <Avatar
            :src="userInfo?.avatar"
            :alt="userInfo?.username"
            class="h-12 w-12"
            img-class="size-full rounded-full object-cover"
          />

          <div class="flex-1">
            <div class="flex gap-2 items-center">
              <a
                :href="href"
                :target="userInfo?.username"
                :alt="userInfo?.username"
              >
                <h3 class="text-base text-gray-900 font-bold dark:text-white">
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

        <div class="mt-1 flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            class="border border-[var(--vp-c-divider)] rounded-full border-solid border-solid"
            :disabled="getUserLoading"
            @click="sendMessage"
          >
            <span class="i-lucide-mail text-sm mr-1" />
            <span>{{ message.forum.labels.privateMessage }}</span>
          </Button>
          <ForumFollowUserButton
            v-if="userInfo?.login"
            size="sm"
            class="border border-[var(--vp-c-divider)] rounded-full border-solid border-solid"
            :user="userInfo?.login"
          />
        </div>
      </div>
    </HoverCardContent>
  </HoverCard>
</template>
