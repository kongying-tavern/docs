<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { ReloadIcon } from '@radix-icons/vue'
import { Button } from '@/components/ui/button'
import { TextMorph } from '@/components/ui/text-morph'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumReaction } from '~/forum/composables/useForumReaction'
import { buildQuotedTopicFormHref, isQuotableTopicType } from '~/forum/services/forumTopicQuote'
import { FORM_HASH } from '../form/publish-topic-form/config'
import { preloadForumPublishForm } from '../utils/forumUi'

const props = withDefaults(defineProps<{ topic: ForumAPI.Topic, autoload?: boolean }>(), {
  autoload: true,
})
const { message } = useLocalized()
const { data: quoteReaction, isLoading } = useForumReaction(
  () => ({ topicId: String(props.topic.id), kind: 'quote' }),
  () => props.autoload && isQuotableTopicType(props.topic.type),
)

function openQuotedTopicForm(): void {
  const href = buildQuotedTopicFormHref(window.location.href, {
    id: String(props.topic.id),
    type: props.topic.type,
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
  <Button
    v-if="isQuotableTopicType(topic.type)"
    type="button"
    variant="ghost"
    size="sm"
    class="rounded-full bg-[var(--vp-c-bg-alt)] h-8 max-mobile:h-9"
    :title="message.forum.topic.quote.action"
    :data-tooltip="message.forum.topic.quote.action"
    @mouseenter="preloadForumPublishForm"
    @focus="preloadForumPublishForm"
    @click="openQuotedTopicForm"
  >
    <span class="i-lucide-quote h-5 w-5 max-mobile:size-5" aria-hidden="true" />
    <span class="sr-only">{{ message.forum.topic.quote.action }}</span>
    <TextMorph
      v-if="quoteReaction"
      :text="String(quoteReaction.data.likeCount)"
      class="tabular-nums"
      aria-live="polite"
    />
    <ReloadIcon v-else-if="isLoading" class="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
    <span v-else aria-hidden="true">–</span>
  </Button>
</template>
