<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { ReloadIcon } from '@radix-icons/vue'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { TextMorph } from '@/components/ui/text-morph'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumReaction } from '~/forum/composables/data/useForumReaction'
import { buildQuotedTopicFormHref, isQuotableTopicType } from '~/forum/services/forumTopicQuote'
import { FORM_HASH } from '../form/publish-topic-form/form-config'
import { preloadForumPublishForm } from '../utils/submitFormUi'

const { autoload = true, topic } = defineProps<{ topic: ForumAPI.Topic, autoload?: boolean }>()
const { message } = useLocalized()
const { data: quoteReaction, error, refetch } = useForumReaction(
  () => ({ topicId: String(topic.id), kind: 'quote' }),
  () => autoload && isQuotableTopicType(topic.type),
)
const loadFailed = computed(() => Boolean(error.value) && !quoteReaction.value)
const retrying = ref(false)

async function retryQuoteReaction() {
  retrying.value = true
  try {
    await refetch()
  }
  finally {
    retrying.value = false
  }
}

function openQuotedTopicForm(): void {
  const href = buildQuotedTopicFormHref(window.location.href, {
    id: String(topic.id),
    type: topic.type,
  }, FORM_HASH)
  const target = new URL(href, window.location.origin)
  const hash = target.hash

  // Write the payload first, then change the hash so the existing lazy form
  // mount and login-intent flow receive one ordinary hashchange event.
  target.hash = ''
  history.replaceState(history.state, '', `${target.pathname}${target.search}`)
  location.hash = hash
}
</script>

<template>
  <div v-if="isQuotableTopicType(topic.type)" class="rounded-full bg-[var(--vp-c-bg-alt)] flex items-center">
    <Button
      type="button"
      variant="ghost"
      size="sm"
      class="rounded-full h-8 max-mobile:h-9"
      :title="message.forum.topic.quote.action"
      :data-tooltip="message.forum.topic.quote.action"
      @mouseenter="preloadForumPublishForm"
      @focus="preloadForumPublishForm"
      @click="openQuotedTopicForm"
    >
      <span class="i-lucide-quote h-5 w-5 max-mobile:size-5" aria-hidden="true" />
      <span class="sr-only">{{ message.forum.topic.quote.action }}</span>
      <TextMorph
        v-if="!loadFailed && !retrying"
        :text="String(quoteReaction?.data.likeCount ?? 0)"
        class="tabular-nums"
        aria-live="polite"
      />
    </Button>
    <Button
      v-if="loadFailed || retrying"
      type="button"
      variant="ghost"
      size="icon"
      class="rounded-full h-8 w-8 max-mobile:h-9 max-mobile:w-9"
      :aria-label="message.forum.auth.callback.error.retry"
      :disabled="retrying"
      :aria-busy="retrying"
      @click="retryQuoteReaction"
    >
      <ReloadIcon class="size-4" :class="{ 'animate-spin motion-reduce:animate-none': retrying }" aria-hidden="true" />
    </Button>
  </div>
</template>

<style scoped>
html[data-reduced-motion='true'] .animate-spin {
  animation: none;
}
</style>
