<script lang="ts" setup>
import type { FORUM } from '../types'
import { useMediaQuery } from '@vueuse/core'
import { computed } from 'vue'
import { SearchField } from '@/components/ui/search-field'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { FORUM_MOBILE_MEDIA_QUERY } from '~/forum/services/forumConfig'
import ForumProfileTabs from './ForumProfileTabs.vue'

const props = defineProps<{ tabs?: FORUM.ProfileTab[] }>()
const isMobile = useMediaQuery(FORUM_MOBILE_MEDIA_QUERY)
const { message } = useLocalized()
const { list } = useForumRoute()
const activeTab = computed(() => list.value?.filter === 'closed' || list.value?.filter === 'archived' ? list.value.filter : 'all')
const tabs = computed(() => props.tabs ?? [
  { id: 'all' as const, label: message.value.forum.header.navigation.allFeedback, state: 'open' as const },
  { id: 'closed' as const, label: message.value.forum.header.navigation.closedFeedback, state: 'progressing' as const },
])
</script>

<template>
  <div class="w-full" data-forum-user-profile-skeleton aria-hidden="true">
    <div class="rounded-lg w-full">
      <div class="mx-auto w-full">
        <div class="p-4 rounded-lg w-full sm:p-6">
          <div class="flex gap-4 items-start max-sm:flex-col sm:gap-6">
            <div class="flex w-full items-start justify-between sm:w-auto">
              <div class="relative">
                <Skeleton class="rounded-full h-20 w-20 sm:h-24 sm:w-24" />
              </div>
              <div class="flex gap-2 sm:hidden">
                <Skeleton class="rounded-md size-9" />
                <Skeleton v-if="isMobile" class="rounded-md size-9" />
                <Skeleton class="rounded-md h-9 w-20" />
              </div>
            </div>

            <div class="flex-1 min-w-0 w-full">
              <div class="flex gap-2 items-center">
                <Skeleton class="h-7 w-24 sm:h-8" />
              </div>

              <Skeleton class="mt-2 h-5 max-w-120 w-full sm:h-6" />

              <div class="mt-3 flex flex-wrap gap-4 sm:mt-4 sm:gap-6">
                <Skeleton class="h-5 w-20" />
                <Skeleton class="h-5 w-28" />
              </div>
            </div>

            <div class="gap-2 hidden sm:flex">
              <Skeleton class="rounded-md size-9" />
              <Skeleton v-if="isMobile" class="rounded-md size-9" />
              <Skeleton class="rounded-md h-9 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full relative" style="border-bottom: 1px solid var(--vp-c-divider)">
      <div class="mx-auto">
        <div class="flex gap-2 min-w-0 items-center">
          <div class="min-w-0 relative max-sm:flex-1 sm:shrink-0" inert>
            <ForumProfileTabs :tabs="tabs" :active-tab="activeTab" v-bind="{ ariaLabel: message.forum.header.navigation.groups.status }" class="opacity-0" />
            <div class="gap-1 grid auto-cols-fr grid-flow-col inset-0 absolute">
              <div v-for="tab in tabs" :key="tab.id" class="px-4 flex min-w-0 items-center justify-center">
                <Skeleton class="h-5 max-w-full w-22 max-sm:w-16" />
              </div>
            </div>
          </div>
          <div v-if="!isMobile" class="min-w-0 relative" data-forum-search-skeleton inert>
            <SearchField
              :model-value="list?.q ?? ''"
              :has-criteria="Boolean(list?.q?.trim())"
              :label="message.ui.button.search"
              class="opacity-0 min-w-0"
            />
            <div
              class="px-2.5 rounded-lg flex gap-1.5 items-center inset-0 absolute"
              :class="list?.q?.trim() && 'border border-[var(--vp-c-divider)] border-solid'"
            >
              <Skeleton class="shrink-0 size-3" />
              <Skeleton class="flex-1 h-3 min-w-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
