<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
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
import ForumEmptyActions from '../ui/ForumEmptyActions.vue'
import ForumEmptyIllustration from '../ui/ForumEmptyIllustration.vue'

const props = defineProps<{
  error?: Error | boolean | null
  query?: string
  refreshData?: () => Promise<unknown> | unknown
}>()
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
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
  <Empty class="forum-empty-state border-none" :aria-busy="retrying" :role="error ? 'alert' : 'status'">
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

    <!-- 主按钮：实心主题色；次按钮：描边 -->
    <ForumEmptyActions v-if="error || isSearchEmpty || hasActiveFilters || showUserEmptyActions">
      <template v-if="!error && (isSearchEmpty || hasActiveFilters)">
        <ForumOpenFeedbackFormButton
          :label="message.forum.empty.createFeedback"
          variant="outline"
          :hide-on-mobile="false"
        />
        <Button @click="handleClearFilters">
          <span class="i-lucide-x icon-btn" aria-hidden="true" />
          {{ message.forum.empty.clearFilters }}
        </Button>
      </template>

      <template v-else-if="showUserEmptyActions">
        <Button variant="outline" @click="handleShowClosed">
          <span class="i-lucide-circle-check icon-btn" aria-hidden="true" />
          {{ message.forum.empty.showClosed }}
        </Button>
        <ForumOpenFeedbackFormButton
          :label="message.forum.empty.createFeedback"
          :hide-on-mobile="false"
        />
      </template>

      <template v-else-if="error">
        <Button
          v-if="unauthorizedError && refreshData"
          variant="outline"
          :disabled="retrying"
          @click="handleRetry"
        >
          <span :class="[retrying ? 'i-lucide-loader-circle' : 'i-lucide-refresh-cw', retrying && !reducedMotion && 'animate-spin']" class="icon-btn" aria-hidden="true" />
          {{ message.forum.auth.callback.error.retry }}
        </Button>
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
      </template>
    </ForumEmptyActions>

    <ForumEmptyActions v-else>
      <ForumOpenFeedbackFormButton
        :label="message.forum.empty.createFeedback"
        :hide-on-mobile="false"
      />
    </ForumEmptyActions>
  </Empty>
</template>
