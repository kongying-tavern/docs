<script lang="ts" setup>
import { ReloadIcon } from '@radix-icons/vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import Divider from '@/components/ui/divider/Divider.vue'
import { TextMorph } from '@/components/ui/text-morph'

const { loading = false, canLoadMore = false, error = false, text = '', status = 'status', rateLimit = false, errorMessage = '' } = defineProps<{
  loading?: boolean
  canLoadMore?: boolean
  error?: boolean
  text?: string
  loadingText?: string
  loadMore?: () => unknown
  retry?: () => unknown
  status?: 'status' | 'alert'
  /** 限流错误特化：展示登录引导而非无意义的重试（匿名额度耗尽时重试必然再失败） */
  rateLimit?: boolean
  /** 具体错误信息（来自 query.error），便于用户判断失败原因 */
  errorMessage?: string
}>()

const emit = defineEmits<{ login: [] }>()
const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <div class="mb-8 flex w-full justify-center" :role="status">
    <div v-if="error && rateLimit && !loading" class="mt-8 flex flex-col gap-3 items-center">
      <p class="text-ui-14 c-[var(--vp-c-text-2)]">
        {{ t('forum.exceededRateLimitWarning') }}
      </p>
      <Button variant="outline" size="sm" @click="emit('login')">
        <span class="i-lucide-log-in icon-btn" aria-hidden="true" />
        {{ t('forum.auth.login') }}
      </Button>
    </div>
    <div v-else-if="error || loading || canLoadMore" class="mt-8 flex flex-col gap-3 items-center">
      <p v-if="error && errorMessage && !loading" class="text-ui-12 c-[var(--vp-c-text-3)]">
        {{ errorMessage }}
      </p>
      <Button
        class="vp-link"
        variant="link"
        :disabled="loading"
        @click="error ? retry?.() : loadMore?.()"
      >
        <ReloadIcon
          v-if="loading || error"
          class="mr-2 h-4 w-4"
          :class="{ 'animate-spin will-change-transform': loading }"
          aria-hidden="true"
        />
        <TextMorph :disabled="loading" :text="loading ? (loadingText ?? t('ui.button.loading')) : error ? t('forum.auth.callback.error.retry') : text" />
      </Button>
    </div>
    <Divider
      v-else
      variant="center"
      class="font-size-3 c-[var(--vp-c-text-3)] w-full"
    >
      {{ text }}
    </Divider>
  </div>
</template>
