<script setup lang="ts">
import type { FORUM } from '../types'
import type ForumAPI from '~/forum/api/types'
import { useDebounceFn, useEventListener, useMediaQuery } from '@vueuse/core'
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import Avatar from '@/components/ui/Avatar.vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import ForumSearchInput from '../search/ForumSearchInput.vue'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumProfileTabs from './ForumProfileTabs.vue'
import ForumUserBio from './ForumUserBio.vue'
import ForumUserProfileStickyBar from './ForumUserProfileStickyBar.vue'

const props = defineProps<{
  username: string
  topicCount: number
  suggestions?: ForumAPI.Topic[]
  renderedUser?: ForumAPI.User
  role: 'official' | null
  isAuthorizedUser: boolean
  menu: FORUM.ProfileTab[]
  query: string
}>()
const emit = defineEmits<{ message: [], search: [query: string], openSearch: [] }>()
defineSlots<{ follow: (props: { textClass?: string }) => unknown }>()
const modelValue = defineModel<'all' | 'closed' | 'archived'>('activeTab', { default: 'all' })
const { message } = useLocalized()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const searchQuery = ref(props.query)
watch(() => props.query, query => searchQuery.value = query)
const tabRowRef = useTemplateRef<HTMLElement>('tabRowRef')
const condensed = ref(false)
let foldObserver: IntersectionObserver | null = null

// tab 行完全滚出站点导航遮挡区后才吸附，负 rootMargin 顶部裁掉导航条高度；
// 相比逐帧 scroll 监听，只有阈值跨越才改状态
function rebuildFoldObserver(): void {
  foldObserver?.disconnect()
  const target = tabRowRef.value
  if (!target)
    return
  const styles = getComputedStyle(document.documentElement)
  const nav = Number.parseFloat(styles.getPropertyValue('--vp-nav-height'))
  const layoutTop = Number.parseFloat(styles.getPropertyValue('--vp-layout-top-height'))
  const topOffset = (Number.isNaN(nav) ? 0 : nav) + (Number.isNaN(layoutTop) ? 0 : layoutTop)
  foldObserver = new IntersectionObserver(([entry]) => {
    condensed.value = !entry.isIntersecting
  }, { rootMargin: `-${topOffset}px 0px 0px 0px` })
  foldObserver.observe(target)
}

onMounted(rebuildFoldObserver)
useEventListener(window, 'resize', useDebounceFn(rebuildFoldObserver, 150))
onBeforeUnmount(() => {
  foldObserver?.disconnect()
  foldObserver = null
})
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
                  @click="emit('message')"
                >
                  <span class="i-lucide-mail text-base" aria-hidden="true" />
                </Button>
                <Button
                  v-if="isMobile"
                  variant="outline"
                  size="icon"
                  class="border border-[var(--vp-c-divider)] border-solid"
                  :aria-label="message.ui.button.search"
                  @click="emit('openSearch')"
                >
                  <span class="i-lucide-search text-base" aria-hidden="true" />
                </Button>
                <span v-if="!isAuthorizedUser && renderedUser?.login" class="border border-[var(--vp-c-divider)] rounded-md border-solid"><slot name="follow" text-class="" /></span>
              </div>
            </div>

            <div class="flex-1 min-w-0 w-full">
              <div class="flex gap-2 items-center">
                <h1 data-forum-user-name class="text-xl text-[var(--vp-c-text-1)] font-bold sm:text-2xl">
                  {{ renderedUser?.username || message.forum.labels.unknown }}
                </h1>
                <span class="rounded-full">
                  <ForumRoleBadge :type="role" />
                </span>
              </div>

              <ForumUserBio :user="renderedUser" :editable="isAuthorizedUser" />

              <div class="font-size-3.5 c-[--vp-c-text-3] mt-3 flex flex-wrap gap-4 sm:mt-4 sm:gap-6">
                <div class="flex gap-2 items-center">
                  <i class="i-lucide-file-text" />
                  <span class="tabular-nums">{{ topicCount }}</span>
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
                @click="emit('message')"
              >
                <span class="i-lucide-mail text-base" aria-hidden="true" />
              </Button>
              <Button
                v-if="isMobile"
                variant="outline"
                size="icon"
                class="border border-[var(--vp-c-divider)] border-solid"
                :aria-label="message.ui.button.search"
                @click="emit('openSearch')"
              >
                <span class="i-lucide-search text-base" aria-hidden="true" />
              </Button>
              <span v-if="!isAuthorizedUser && renderedUser?.login" class="border border-[var(--vp-c-divider)] rounded-md border-solid"><slot name="follow" text-class="max-sm:hidden" /></span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div ref="tabRowRef" class="w-full relative" style="border-bottom: 1px solid var(--vp-c-divider)">
      <div class="mx-auto">
        <div class="flex gap-2 min-w-0 items-center">
          <ForumProfileTabs
            v-model:active-tab="modelValue"
            layout="fill"
            :tabs="menu"
            v-bind="{ ariaLabel: message.forum.header.navigation.groups.status }"
            class="max-sm:flex-1 sm:shrink-0"
          />
          <ForumSearchInput
            v-if="!isMobile"
            v-model:query="searchQuery"
            class="min-w-0"
            :suggestions="suggestions"
            @submit="emit('search', $event)"
          />
        </div>
      </div>
    </div>

    <ForumUserProfileStickyBar
      v-model:active-tab="modelValue"
      :username="renderedUser?.username || ''"
      :avatar="renderedUser?.avatar"
      :login="renderedUser?.login"
      :role="role"
      :is-authorized-user="isAuthorizedUser"
      :visible="condensed"
      :tabs="menu"
      @message="emit('message')"
    >
      <template #follow>
        <slot name="follow" />
      </template>
    </ForumUserProfileStickyBar>
  </div>
</template>
