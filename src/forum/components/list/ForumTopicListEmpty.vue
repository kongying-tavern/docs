<script setup lang="ts">
import type { ForumFilter } from '~/forum/services/forumRoute'
import { computed, ref } from 'vue'
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
import { useSitePreferences } from '~/composables/useSitePreferences'
import { GiteeAPIError } from '~/forum/api/gitee'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumSearchToken } from '~/forum/composables/view/useForumSearchToken'
import ForumOpenFeedbackFormButton from '../form/ForumOpenFeedbackFormButton.vue'
import ForumEmptyIllustration from '../ui/ForumEmptyIllustration.vue'

const props = defineProps<{
  error?: Error | boolean | null
  query?: string
  refreshData?: () => Promise<unknown> | unknown
}>()
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const { route, navigate } = useForumRoute()
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

const filterRecommendation = computed(() => {
  const current = route.value
  if (!current || !('list' in current))
    return null
  const { list } = current
  const copy = message.value.forum.empty
  // 先放宽搜索和类型，再切换状态；每次只推荐一个保留其余条件的恢复操作。
  if (list.q)
    return { key: 'query', label: copy.clearSearch, changes: { q: '' } }
  if (list.topicType !== 'all')
    return { key: 'type', label: copy.showAllTypes, changes: { topicType: 'all' as const } }
  if (list.creator) {
    if (list.filter === 'all')
      return { key: 'closed', label: copy.switchClosed, changes: { filter: 'closed' as const } }
    return { key: 'all', label: copy.switchOpen, changes: { filter: 'all' as const } }
  }
  if (list.filter !== 'everything')
    return { key: 'everything', label: copy.switchEverything, changes: { filter: 'everything' as const } }
  return null
})

async function applyRecommendation(changes: Partial<{ filter: ForumFilter, topicType: 'all', q: string }>) {
  const current = route.value
  if (!current || !('list' in current))
    return
  await navigate({ ...current, list: { ...current.list, ...changes } })
}

const errorDescription = computed(() => {
  if (rateLimitError.value)
    return message.value.forum.exceededRateLimitWarning
  if (unauthorizedError.value)
    return message.value.forum.auth.loginTips
  return message.value.forum.errors.loadFailedHint
})

const stateKey = computed(() => {
  if (props.error)
    return rateLimitError.value ? 'rate-limit' : unauthorizedError.value ? 'locked' : 'error'
  if (isSearchEmpty.value)
    return 'search'
  return hasActiveFilters.value ? 'filtered' : 'feedback'
})
const retrying = ref(false)

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

async function handleRetry() {
  if (retrying.value)
    return
  retrying.value = true
  try {
    await props.refreshData?.()
  }
  finally {
    retrying.value = false
  }
}
</script>

<template>
  <Empty data-testid="feedback-empty-state" :data-state="stateKey" class="forum-empty-state border-none" :aria-busy="retrying" :role="error ? 'alert' : 'status'">
    <EmptyHeader>
      <EmptyMedia>
        <EmptySwap :swap-key="stateKey" variant="icon">
          <ForumEmptyIllustration :variant="stateKey" :busy="retrying" />
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

    <EmptyActions variant="pills">
      <template v-if="!error">
        <Button
          v-if="filterRecommendation"
          :data-testid="`empty-filter-${filterRecommendation.key}`"
          @click="applyRecommendation(filterRecommendation.changes)"
        >
          <span class="i-lucide-list-filter icon-btn" aria-hidden="true" />
          {{ filterRecommendation.label }}
        </Button>
        <ForumOpenFeedbackFormButton
          :label="message.forum.empty.createFeedback"
          :variant="filterRecommendation ? 'outline' : 'default'"
          :hide-on-mobile="false"
        />
      </template>

      <template v-else>
        <Button v-if="rateLimitError || unauthorizedError" @click="handleLogin">
          <span class="i-lucide-log-in icon-btn" aria-hidden="true" />
          {{ message.forum.auth.login }}
        </Button>
        <Button
          v-else-if="refreshData"
          :disabled="retrying"
          @click="handleRetry"
        >
          <span :class="[retrying ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw', retrying && !reducedMotion && 'animate-spin']" class="icon-btn" aria-hidden="true" />
          {{ message.forum.auth.callback.error.retry }}
        </Button>
        <Button
          v-if="unauthorizedError && refreshData"
          variant="outline"
          :disabled="retrying"
          @click="handleRetry"
        >
          <span :class="[retrying ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw', retrying && !reducedMotion && 'animate-spin']" class="icon-btn" aria-hidden="true" />
          {{ message.forum.auth.callback.error.retry }}
        </Button>
      </template>
    </EmptyActions>
  </Empty>
</template>
