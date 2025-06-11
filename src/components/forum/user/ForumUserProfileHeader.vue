<script setup lang="ts">
import { user } from '@/apis/forum/gitee'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { useUserAuthStore } from '@/stores/useUserAuth'
import { useUserInfoStore } from '@/stores/useUserInfo'
import { getLangPath } from '@/utils'
import { useData, useRouter, withBase } from 'vitepress'
import { computed, ref, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import { useRuleChecks } from '~/composables/useRuleChecks'
import ForumRoleBadge from '../ForumRoleBadge.vue'
import { setPageTitle } from '../utils'
import ForumFollowUserButton from './ForumFollowUserButton.vue'

const { username } = defineProps<{
  username: string
  topicCount: number
}>()

const modelValue = defineModel('activeTab', { default: 'feedback' })

const { go } = useRouter()
const { localeIndex } = useData()

const userInfo = useUserInfoStore()
const userAuth = useUserAuthStore()
const menuRef = ref<HTMLElement | null>(null)

const { runAsync: getUser, data: userData } = useRequest(user.getUser, {
  manual: true,
  onError: (err) => {
    toast.error(`拉取用户资料失败 (${err})`)

    if (err.message.includes('404 Not Found')) {
      return go(withBase(`${getLangPath(localeIndex.value)}404.html`))
    }
  },
})

if (!userInfo.info || userInfo?.info.username !== username || userInfo?.info.login !== username) {
  await getUser(username, userAuth.isTokenValid ? userAuth.auth.accessToken : undefined)
}

const { isOfficial } = useRuleChecks()

const renderedUser = computed(() => {
  if (userInfo.info && userInfo.info.username === username) {
    return userInfo.info
  }
  else {
    return userData.value
  }
})

const role = computed(() => (isOfficial(renderedUser.value?.id || 0).value ? 'official' : null))
const isAuthorizedUser = computed(() => username === userInfo.info?.username || username === userInfo.info?.login)

const menu = computed<{
  id: string
  label: string
  icon: string
}[]>(() => {
  return [
    {
      id: 'feedback',
      label: isAuthorizedUser.value ? '我的反馈' : '提交的反馈',
      icon: 'i-lucide-file-text',
    },
  ]
})

function sendMessage() {
  window.open(`https://gitee.com/notifications/messages/${renderedUser.value?.id}`, String(renderedUser.value?.id))
}

watch(renderedUser, (newVal) => {
  if (!newVal)
    return
  setPageTitle(`${newVal.username} 的个人主页`)
}, {
  immediate: true,
})
</script>

<template>
  <div class="w-full">
    <div class="w-full rounded-lg">
      <div class="mx-auto w-full">
        <div class="w-full rounded-lg p-4 sm:p-6">
          <div class="flex flex-col items-start gap-4 sm:flex-row sm:gap-6">
            <!-- 头像和按钮行 -->
            <div class="w-full flex items-start justify-between sm:w-auto">
              <div class="relative">
                <Avatar
                  :src="renderedUser?.avatar" :alt="renderedUser?.username" class="h-20 w-20 sm:h-24 sm:w-24"
                  img-class="size-full rounded-full object-cover ring-4"
                />
              </div>
              <div class="flex gap-2 sm:hidden">
                <Button variant="outline" class="border border-[var(--vp-c-divider)] rounded-full border-solid">
                  <span class="i-lucide-mail text-base" @click="sendMessage" />
                  <span class="max-sm:hidden">私信</span>
                </Button>
                <ForumFollowUserButton v-if="renderedUser?.login" class="border border-[var(--vp-c-divider)] rounded-full border-solid" :user="renderedUser?.login" />
              </div>
            </div>

            <!-- 用户信息 -->
            <div class="w-full flex-1">
              <div class="flex items-center gap-2">
                <h1 class="text-xl text-gray-900 font-bold sm:text-2xl dark:text-white">
                  {{ renderedUser?.username || 'Unknown' }}
                </h1>
                <span class="rounded-full">
                  <ForumRoleBadge :type="role" />
                </span>
              </div>

              <p class="mt-1.5 text-sm text-gray-600 sm:mt-2 sm:text-base dark:text-gray-400">
                {{ renderedUser?.bio || '这个人很懒，什么都没写~' }}
              </p>

              <!-- 统计信息 -->
              <div class="mt-3 flex flex-wrap gap-4 font-size-3.5 c-[--vp-c-text-3] sm:mt-4 sm:gap-6">
                <div class="flex items-center gap-2">
                  <i class="i-lucide-file-text" />
                  <span>{{ topicCount }}</span>
                  <span>帖子</span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="i-lucide-calendar-days" />
                  <span>{{ renderedUser?.createAt?.toLocaleDateString() || '未知' }}</span>
                  <span>加入时间</span>
                </div>
              </div>
            </div>

            <!-- PC端操作按钮 -->
            <div class="hidden gap-2 sm:flex">
              <Button variant="outline" class="border border-[var(--vp-c-divider)] rounded-full border-solid">
                <span class="i-lucide-mail text-base" @click="sendMessage" />
              </Button>
              <ForumFollowUserButton v-if="renderedUser?.login" class="border border-[var(--vp-c-divider)] rounded-full border-solid" text-class="max-sm:hidden" :user="renderedUser?.login" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="relative w-full border-b">
      <div class="mx-auto">
        <div ref="menuRef" class="relative h-12 flex items-center gap-3">
          <Button
            v-for="item in menu"
            :key="item.id"
            class="group relative whitespace-nowrap hover:c-[--vp-c-brand]"
            :class="{ 'c-[--vp-c-brand]': modelValue === item.id }"
            variant="ghost"
            @click="modelValue = item.id"
          >
            <div class="relative flex items-center">
              <span class="mr-2 inline-block" :class="item.icon" />
              {{ item.label }}
              <!-- 使用内部相对定位元素实现内容宽度的指示器 -->
              <span
                v-if="modelValue === item.id"
                class="absolute left-0 h-0.5 w-full bg-[var(--vp-c-brand)] transition-all duration-300 -bottom-[15px]"
              />
            </div>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
