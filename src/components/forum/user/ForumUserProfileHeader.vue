<script setup lang="ts">
import { onMounted } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import { useUserProfile } from './composables/useUserProfile'
import ForumFollowUserButton from './ForumFollowUserButton.vue'

const props = defineProps<{
  username: string
  topicCount: number
}>()

const modelValue = defineModel('activeTab', { default: 'feedback' })
const { message } = useLocalized()

// Use user profile composable
const {
  menuRef,
  renderedUser,
  role,
  menu,
  loadUserData,
  sendMessage,
} = useUserProfile({
  username: props.username,
  topicCount: props.topicCount,
})

// Load user data on mount
onMounted(async () => {
  await loadUserData()
})
</script>

<template>
  <div class="w-full">
    <div class="rounded-lg w-full">
      <div class="mx-auto w-full">
        <div class="p-4 rounded-lg w-full sm:p-6">
          <div class="flex flex-col gap-4 items-start sm:flex-row sm:gap-6">
            <!-- 头像和按钮行 -->
            <div class="flex w-full items-start justify-between sm:w-auto">
              <div class="relative">
                <Avatar
                  :src="renderedUser?.avatar"
                  :alt="renderedUser?.username"
                  class="h-20 w-20 sm:h-24 sm:w-24"
                  img-class="size-full rounded-full object-cover ring-4"
                />
              </div>
              <div class="flex gap-2 sm:hidden">
                <Button
                  variant="outline"
                  class="border border-[var(--vp-c-divider)] rounded-full border-solid border-solid"
                >
                  <span
                    class="i-lucide-mail text-base"
                    @click="sendMessage"
                  />
                  <span class="max-sm:hidden">私信</span>
                </Button>
                <ForumFollowUserButton
                  v-if="renderedUser?.login"
                  class="border border-[var(--vp-c-divider)] rounded-full border-solid border-solid"
                  :user="renderedUser?.login"
                />
              </div>
            </div>

            <!-- 用户信息 -->
            <div class="flex-1 w-full">
              <div class="flex gap-2 items-center">
                <h1 class="text-xl text-gray-900 font-bold sm:text-2xl dark:text-white">
                  {{ renderedUser?.username || 'Unknown' }}
                </h1>
                <span class="rounded-full">
                  <ForumRoleBadge :type="role" />
                </span>
              </div>

              <p class="text-sm text-gray-600 mt-1.5 sm:text-base dark:text-gray-400 sm:mt-2">
                {{ renderedUser?.bio || message.forum.labels.lazyPerson }}
              </p>

              <!-- 统计信息 -->
              <div class="font-size-3.5 c-[--vp-c-text-3] mt-3 flex flex-wrap gap-4 sm:mt-4 sm:gap-6">
                <div class="flex gap-2 items-center">
                  <i class="i-lucide-file-text" />
                  <span>{{ topicCount }}</span>
                  <span>{{ message.forum.labels.posts }}</span>
                </div>
                <div class="flex gap-2 items-center">
                  <i class="i-lucide-calendar-days" />
                  <span>{{ renderedUser?.createAt?.toLocaleDateString() || message.forum.labels.unknown }}</span>
                  <span>{{ message.forum.labels.joinTime }}</span>
                </div>
              </div>
            </div>

            <!-- PC端操作按钮 -->
            <div class="gap-2 hidden sm:flex">
              <Button
                variant="outline"
                class="border border-[var(--vp-c-divider)] rounded-full border-solid border-solid"
              >
                <span
                  class="i-lucide-mail text-base"
                  @click="sendMessage"
                />
              </Button>
              <ForumFollowUserButton
                v-if="renderedUser?.login"
                class="border border-[var(--vp-c-divider)] rounded-full border-solid border-solid"
                text-class="max-sm:hidden"
                :user="renderedUser?.login"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="border-b w-full relative">
      <div class="mx-auto">
        <div
          ref="menuRef"
          class="flex gap-3 h-12 items-center relative"
        >
          <Button
            v-for="item in menu"
            :key="item.id"
            class="group whitespace-nowrap relative hover:c-[--vp-c-brand]"
            :class="{ 'c-[--vp-c-brand]': modelValue === item.id }"
            variant="ghost"
            @click="modelValue = item.id"
          >
            <div class="flex items-center relative">
              <span
                class="mr-2 inline-block"
                :class="item.icon"
              />
              {{ item.label }}
              <!-- 使用内部相对定位元素实现内容宽度的指示器 -->
              <span
                v-if="modelValue === item.id"
                class="bg-[var(--vp-c-brand)] h-0.5 w-full transition-all duration-300 left-0 absolute -bottom-[15px]"
              />
            </div>
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
