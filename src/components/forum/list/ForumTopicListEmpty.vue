<script setup lang="ts">
import { Info, Search } from '@lucide/vue'
import { computed } from 'vue'
import { GiteeAPIError } from '@/apis/forum/gitee'
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
import OpenFeedbackFormButton from '../form/OpenFeedbackFormButton.vue'

const props = defineProps<{
  error?: Error | boolean | null
  query?: string
  refreshData?: () => Promise<unknown> | unknown
}>()
const { message } = useLocalized()

const rateLimitError = computed(() =>
  props.error instanceof GiteeAPIError && props.error.isExceededRateLimit())
const unauthorizedError = computed(() =>
  props.error instanceof GiteeAPIError && props.error.isUnauthorized())

const isSearchEmpty = computed(() => Boolean(props.query) && !props.error)
const searchTitle = computed(() => message.value.forum.empty.searchTitle.replace('{query}', props.query || ''))

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
    <EmptyContent v-if="error || !isSearchEmpty">
      <div class="flex gap-2">
        <OpenFeedbackFormButton v-if="!error" />

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
