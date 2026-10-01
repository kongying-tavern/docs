<script setup lang="ts">
import { CircleAlert, Inbox, Search } from '@lucide/vue'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { EmptyMorphFrame, EmptySwap } from '@/components/ui/empty-motion'
import { useLocalized } from '@/hooks/useLocalized'
import { GiteeAPIError } from '~/forum/api/gitee'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumSearchToken } from '~/forum/composables/view/useForumSearchToken'
import ForumOpenFeedbackFormButton from '../form/ForumOpenFeedbackFormButton.vue'

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
  return message.value.forum.errors.loadFailedHint
})

const stateKey = computed(() => props.error ? 'error' : isSearchEmpty.value ? 'search' : 'inbox')

const title = computed(() => props.error
  ? message.value.forum.loadError
  : isSearchEmpty.value ? searchTitle.value : message.value.forum.empty.title)

const description = computed(() => props.error
  ? errorDescription.value
  : isSearchEmpty.value
    ? message.value.forum.empty.searchDescription
    : message.value.forum.empty.description)

const morphKey = computed(() => `${title.value}\n${description.value}`)

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
      <EmptyMedia variant="icon" class="border !rounded-xl !size-12">
        <EmptySwap :swap-key="stateKey" variant="icon">
          <CircleAlert v-if="error" :stroke-width="1.5" />
          <Search v-else-if="isSearchEmpty" :stroke-width="1.5" />
          <Inbox v-else :stroke-width="1.5" />
        </EmptySwap>
      </EmptyMedia>
      <EmptyMorphFrame :morph-key="morphKey">
        <EmptyTitle class="w-full">
          <EmptySwap :swap-key="title">
            {{ title }}
          </EmptySwap>
        </EmptyTitle>
        <EmptyDescription class="max-w-72 w-full">
          <EmptySwap :swap-key="description">
            {{ description }}
          </EmptySwap>
        </EmptyDescription>
      </EmptyMorphFrame>
    </EmptyHeader>

    <!-- 主按钮：实心主题色；次按钮：描边 -->
    <EmptyActions v-if="error || isSearchEmpty || hasActiveFilters || showUserEmptyActions">
      <template v-if="!error && (isSearchEmpty || hasActiveFilters)">
        <Button @click="handleClearFilters">
          <span class="i-lucide-x icon-btn" aria-hidden="true" />
          {{ message.forum.empty.clearFilters }}
        </Button>
        <ForumOpenFeedbackFormButton
          :label="message.forum.empty.createFeedback"
          variant="outline"
          :hide-on-mobile="false"
        />
      </template>

      <template v-else-if="showUserEmptyActions">
        <ForumOpenFeedbackFormButton
          :label="message.forum.empty.createFeedback"
          :hide-on-mobile="false"
        />
        <Button variant="outline" @click="handleShowClosed">
          <span class="i-lucide-circle-check icon-btn" aria-hidden="true" />
          {{ message.forum.empty.showClosed }}
        </Button>
      </template>

      <template v-else-if="error">
        <Button v-if="rateLimitError || unauthorizedError" @click="handleLogin">
          <span class="i-lucide-log-in icon-btn" aria-hidden="true" />
          {{ message.forum.auth.login }}
        </Button>
        <Button
          v-else-if="refreshData"
          @click="handleRetry"
        >
          {{ message.forum.auth.callback.error.retry }}
        </Button>
        <Button
          v-if="unauthorizedError && refreshData"
          variant="outline"
          @click="handleRetry"
        >
          {{ message.forum.auth.callback.error.retry }}
        </Button>
      </template>
    </EmptyActions>

    <EmptyActions v-else>
      <ForumOpenFeedbackFormButton
        :label="message.forum.empty.createFeedback"
        :hide-on-mobile="false"
      />
    </EmptyActions>
  </Empty>
</template>
