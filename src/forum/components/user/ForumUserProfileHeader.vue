<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { useMediaQuery } from '@vueuse/core'
import { ref, watch } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import ForumSearchInput from '../search/ForumSearchInput.vue'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import { useUserProfile } from './composables/useUserProfile'
import ForumFollowUserButton from './ForumFollowUserButton.vue'

const props = defineProps<{
  username: string
  topicCount: number
  suggestions?: ForumAPI.Topic[]
}>()

const modelValue = defineModel<'all' | 'closed'>('activeTab', { default: 'all' })
const { message } = useLocalized()
const { list, openSearch, openSearchWithQuery } = useForumRoute()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const searchQuery = ref(list.value?.q ?? '')

watch(() => list.value?.q ?? '', query => searchQuery.value = query)

const {
  menuRef,
  renderedUser,
  role,
  isAuthorizedUser,
  menu,
  sendMessage,
} = useUserProfile(() => props.username)
</script>

<template>
  <div class="w-full" :data-forum-user-profile="username">
    <div class="rounded-lg w-full">
      <div class="mx-auto w-full">
        <div class="p-4 rounded-lg w-full sm:p-6">
          <div class="flex flex-col gap-4 items-start sm:flex-row sm:gap-6">
            <div class="flex w-full items-start justify-between sm:w-auto">
              <div class="relative">
                <Avatar
                  data-forum-user-avatar
                  :src="renderedUser?.avatar"
                  :alt="renderedUser?.username"
                  class="h-20 w-20 sm:h-24 sm:w-24"
                  img-class="size-full rounded-full object-cover ring-4"
                />
              </div>
              <div class="flex gap-2 sm:hidden">
                <Button
                  v-if="!isAuthorizedUser"
                  variant="outline"
                  size="icon"
                  class="border border-[var(--vp-c-divider)] border-solid"
                  :aria-label="message.forum.labels.privateMessage"
                  @click="sendMessage"
                >
                  <span class="i-lucide-mail text-base" aria-hidden="true" />
                </Button>
                <Button
                  v-if="isMobile"
                  variant="outline"
                  size="icon"
                  class="border border-[var(--vp-c-divider)] border-solid"
                  :aria-label="message.ui.button.search"
                  @click="openSearch"
                >
                  <span class="i-lucide-search text-base" aria-hidden="true" />
                </Button>
                <ForumFollowUserButton
                  v-if="!isAuthorizedUser && renderedUser?.login"
                  class="border border-[var(--vp-c-divider)] rounded-md border-solid"
                  :user="renderedUser?.login"
                />
              </div>
            </div>

            <div class="flex-1 w-full">
              <div class="flex gap-2 items-center">
                <h1 data-forum-user-name class="text-xl text-[var(--vp-c-text-1)] font-bold sm:text-2xl">
                  {{ renderedUser?.username || message.forum.labels.unknown }}
                </h1>
                <span class="rounded-full">
                  <ForumRoleBadge :type="role" />
                </span>
              </div>

              <p class="text-sm c-[var(--vp-c-text-2)] mt-1.5 sm:text-base sm:mt-2">
                {{ renderedUser?.bio || message.forum.labels.lazyPerson }}
              </p>

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

            <div class="gap-2 hidden sm:flex">
              <Button
                v-if="!isAuthorizedUser"
                variant="outline"
                size="icon"
                class="border border-[var(--vp-c-divider)] border-solid"
                :aria-label="message.forum.labels.privateMessage"
                @click="sendMessage"
              >
                <span class="i-lucide-mail text-base" aria-hidden="true" />
              </Button>
              <Button
                v-if="isMobile"
                variant="outline"
                size="icon"
                class="border border-[var(--vp-c-divider)] border-solid"
                :aria-label="message.ui.button.search"
                @click="openSearch"
              >
                <span class="i-lucide-search text-base" aria-hidden="true" />
              </Button>
              <ForumFollowUserButton
                v-if="!isAuthorizedUser && renderedUser?.login"
                class="border border-[var(--vp-c-divider)] rounded-md border-solid"
                text-class="max-sm:hidden"
                :user="renderedUser?.login"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full relative" style="border-bottom: 1px solid var(--vp-c-divider)">
      <div class="mx-auto">
        <div class="flex gap-2 min-w-0 items-center">
          <div
            ref="menuRef"
            role="group"
            :aria-label="message.forum.header.navigation.groups.status"
            class="profile-tabs shrink-0 gap-1 grid h-12 items-stretch relative"
            :data-active-tab="modelValue"
          >
            <Button
              v-for="item in menu"
              :key="item.id"
              class="group px-4 rounded-md h-full whitespace-nowrap relative hover:c-[--vp-c-brand]"
              :class="{ 'c-[--vp-c-brand]': modelValue === item.id }"
              variant="ghost"
              :aria-pressed="modelValue === item.id"
              @click="modelValue = item.id"
            >
              <div class="flex items-center">
                <span
                  class="mr-2 inline-block"
                  :class="item.icon"
                  aria-hidden="true"
                />
                {{ item.label }}
              </div>
            </Button>
            <span class="profile-tab-indicator" aria-hidden="true" />
          </div>
          <ForumSearchInput
            v-if="!isMobile"
            v-model:query="searchQuery"
            class="min-w-0"
            :suggestions="suggestions"
            @submit="openSearchWithQuery"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-tabs {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.profile-tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  width: calc((100% - 0.25rem) / 2);
  height: 0.125rem;
  border-radius: 999px;
  background: var(--vp-c-brand);
  transform: translateX(0);
  transition: transform 210ms cubic-bezier(0.32, 0.72, 0, 1);
  pointer-events: none;
}

.profile-tabs[data-active-tab='closed'] .profile-tab-indicator {
  transform: translateX(calc(100% + 0.25rem));
}

@media (prefers-reduced-motion: reduce) {
  .profile-tab-indicator {
    transition: none;
  }
}
</style>
