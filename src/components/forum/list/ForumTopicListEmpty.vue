<script setup lang="ts">
import { Info, Search } from '@lucide/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import { useForumSearchToken } from '~/composables/useForumSearchToken'
import { GiteeAPIError } from '~/services/forum/gitee'
import OpenFeedbackFormButton from '../form/OpenFeedbackFormButton.vue'

const props = defineProps<{
  error?: Error | boolean | null
  query?: string
  refreshData?: () => Promise<unknown> | unknown
}>()
const { message } = useLocalized()
const { route, navigate, navigateFilter } = useForumRoute()
const { formatSearchQuery } = useForumSearchToken()

const rateLimitError = computed(() =>
  props.error instanceof GiteeAPIError && props.error.isExceededRateLimit())
const unauthorizedError = computed(() =>
  props.error instanceof GiteeAPIError && props.error.isUnauthorized())

const isSearchEmpty = computed(() => Boolean(props.query) && !props.error)
const searchTitle = computed(() => message.value.forum.empty.searchTitle
  .replace('{query}', formatSearchQuery(props.query || '')))

const hasActiveFilters = computed(() => {
  const list = route.value && 'list' in route.value ? route.value.list : null
  if (!list)
    return false
  return Boolean(list.q) || list.filter !== 'all' || list.topicType !== 'all'
})

// 用户页「未结」默认筛选且无搜索时的空列表：给出新建反馈、查看已结两个出口
const showUserEmptyActions = computed(() =>
  route.value?.name === 'user' && !props.error && !isSearchEmpty.value && !hasActiveFilters.value)

async function handleClearFilters() {
  const current = route.value
  if (!current || !('list' in current))
    return
  await navigate({ ...current, list: { ...current.list, q: '', filter: 'all', topicType: 'all' } })
}

async function handleShowClosed() {
  await navigateFilter('closed')
}

const errorDescription = computed(() => {
  if (rateLimitError.value)
    return message.value.forum.exceededRateLimitWarning
  if (unauthorizedError.value)
    return message.value.forum.auth.loginTips
  return message.value.forum.errors.cannotLoadData
})

function handleLogin() {
  location.hash = 'login-alert'
}

function handleRetry() {
  props.refreshData?.()
}
</script>

<template>
  <Empty class="border-none">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Search v-if="isSearchEmpty" />
        <Info v-else />
      </EmptyMedia>
      <EmptyTitle>
        {{ error ? message.forum.loadError : isSearchEmpty ? searchTitle : message.forum.empty.title }}
      </EmptyTitle>
      <EmptyDescription>
        {{ error ? errorDescription : isSearchEmpty ? message.forum.empty.searchDescription : message.forum.empty.description }}
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent v-if="error || isSearchEmpty || hasActiveFilters || showUserEmptyActions">
      <div class="flex gap-2">
        <Button
          v-if="!error && (isSearchEmpty || hasActiveFilters)"
          variant="outline"
          @click="handleClearFilters"
        >
          <span class="i-lucide-x icon-btn" aria-hidden="true" />
          {{ message.forum.empty.clearFilters }}
        </Button>

        <template v-if="showUserEmptyActions">
          <OpenFeedbackFormButton :label="message.forum.empty.createFeedback" />

          <Button variant="outline" @click="handleShowClosed">
            <span class="i-lucide-circle-check icon-btn" aria-hidden="true" />
            {{ message.forum.empty.showClosed }}
          </Button>
        </template>

        <Button
          v-if="rateLimitError || unauthorizedError"
          @click="handleLogin"
        >
          <span class="i-lucide-log-in icon-btn" aria-hidden="true" />
          {{ message.forum.auth.login }}
        </Button>
        <Button
          v-if="error && refreshData && !rateLimitError && !unauthorizedError"
          variant="ghost"
          @click="handleRetry"
        >
          {{ message.forum.auth.callback.error.retry }}
        </Button>
      </div>
    </EmptyContent>
  </Empty>
</template>
