<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { createReusableTemplate } from '@vueuse/core'
import { useRouter } from 'vitepress'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { decodeTopicBody } from '~/forum/services/forumContentCodec'
import { renderForumTopicSummary } from '~/forum/services/forumContentRenderer'
import { shouldShowQuotedTopicImageBelow } from '~/forum/services/forumTopicQuote'
import ForumImage from '../ui/ForumImage.vue'
import ForumResponsiveMenu from '../ui/responsive/ForumResponsiveMenu.vue'
import ForumTopicHeader from './ForumTopicHeader.vue'

const { topic = undefined, loading = false, unavailable = false, interactive = true, compact = false, reference } = defineProps<{
  reference: ForumAPI.QuotedTopicReference
  topic?: ForumAPI.Topic
  loading?: boolean
  unavailable?: boolean
  interactive?: boolean
  compact?: boolean
  removable?: boolean
  removeDisabled?: boolean
}>()

const emit = defineEmits<{
  retry: []
  remove: []
}>()

const router = useRouter()
const [UseRemoveMenu, RemoveMenu] = createReusableTemplate()
const { message } = useLocalized()
const { topicHref } = useForumRoute()
const detailHref = computed(() => topicHref(reference.id, null))
const renderedContent = computed(() => topic
  ? renderForumTopicSummary(decodeTopicBody(topic.contentRaw).content, { topicHref: id => topicHref(id, null) })
  : '')
const images = computed(() => (topic?.content.images ?? []).map(image => ({
  src: image.src,
  alt: image.alt || '',
  thumbHash: image.thumbHash,
  width: image.width,
  height: image.height,
})))
const showWideImage = computed(() => !compact && shouldShowQuotedTopicImageBelow(images.value))
const showSideImages = computed(() => images.value.length > 0 && !showWideImage.value)
const imageContext = computed(() => topic
  ? { kind: 'topic' as const, topic, repo: 'Feedback' as const, topicAuthorId: topic.user.id }
  : undefined)

function openTopic(event: MouseEvent | KeyboardEvent): void {
  if (!interactive)
    return
  const target = event.target as HTMLElement
  if (target.closest('a, button'))
    return
  if (event instanceof MouseEvent && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey))
    return
  void router.go(detailHref.value)
}
</script>

<template>
  <div
    class="quoted-topic-card text-[var(--vp-c-text-1)] rounded-lg overflow-hidden"
    :class="{
      'quoted-topic-card--interactive cursor-pointer': topic && interactive,
      'quoted-topic-card--readonly': !interactive,
      'quoted-topic-card--compact': compact,
    }"
    :role="topic && interactive ? 'link' : undefined"
    :tabindex="topic && interactive ? 0 : undefined"
    @click="openTopic"
    @keydown.enter="openTopic"
  >
    <UseRemoveMenu>
      <ForumResponsiveMenu v-if="removable" :items="[{ id: 'remove-reference', type: 'item', label: message.forum.publish.feedbackForm.removeReference, disabled: removeDisabled, action: () => emit('remove') }]" align="end">
        <template #trigger>
          <Button type="button" variant="ghost" size="icon-sm" :disabled="removeDisabled" :aria-label="message.forum.topic.menu.moreActions">
            <span class="i-lucide-ellipsis" aria-hidden="true" />
          </Button>
        </template>
      </ForumResponsiveMenu>
    </UseRemoveMenu>
    <div class="quote-card-inner p-3">
      <div v-if="loading" class="flex flex-col gap-2" aria-live="polite">
        <div class="flex gap-2 items-center">
          <Skeleton class="rounded-full size-6" />
          <Skeleton class="h-4 w-28" />
          <div v-if="removable" class="ml-auto">
            <RemoveMenu />
          </div>
        </div>
        <Skeleton class="h-4 w-2/3" />
        <Skeleton class="h-4 w-full" />
        <Skeleton v-if="!compact" class="h-4 w-4/5" />
        <span class="sr-only">{{ message.forum.topic.quote.loading }}</span>
      </div>

      <div v-else-if="unavailable || !topic" class="quote-unavailable text-sm color-[var(--vp-c-text-2)] py-4 flex gap-2 items-center">
        <span class="i-lucide-message-square-off shrink-0 size-4" aria-hidden="true" />
        <span>{{ message.forum.topic.quote.unavailable }}</span>
        <button
          type="button"
          class="vp-link ml-auto"
          @click.stop="emit('retry')"
        >
          {{ message.forum.topic.quote.retry }}
        </button>
        <RemoveMenu />
      </div>

      <template v-else>
        <ForumTopicHeader :topic="topic" :show-menu="false" :interactive="interactive">
          <template v-if="removable" #menu>
            <RemoveMenu />
          </template>
        </ForumTopicHeader>

        <h4 v-if="topic.type !== 'BUG'" class="quote-title font-semibold m-0 mt-2 min-w-0 line-clamp-1">
          {{ topic.title }}
        </h4>

        <div class="quote-content mt-2 flex gap-3 items-start">
          <div
            v-if="interactive"
            class="forum-topic-summary text-sm flex-1 min-w-0 whitespace-pre-wrap overflow-hidden"
            :class="compact ? 'line-clamp-2' : 'line-clamp-5'"
            v-html="renderedContent"
          />
          <div
            v-else
            class="text-sm flex-1 min-w-0 whitespace-pre-wrap overflow-hidden"
            :class="compact ? 'line-clamp-2' : 'line-clamp-5'"
          >
            {{ topic.content.text }}
          </div>
          <div v-if="showSideImages" class="quote-side-media shrink-0">
            <ForumImage
              layout="thumbnail"
              :images="images"
              :max-display="4"
              :context="imageContext"
              :preview-enabled="interactive"
            />
          </div>
        </div>

        <ForumImage
          v-if="showWideImage"
          class="quote-wide-media mt-3"
          layout="single"
          :images="images"
          :context="imageContext"
          container-class="quote-wide-image"
          :preview-enabled="interactive"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.quoted-topic-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid transparent;
  transition: border-color 150ms ease-out;
}

.quoted-topic-card--readonly {
  background: color-mix(in srgb, var(--vp-c-bg-soft) 92%, var(--vp-c-text-1) 8%);
}

.quoted-topic-card:hover,
.quoted-topic-card:focus-visible {
  border-color: var(--vp-c-border);
}

.quoted-topic-card--compact .quote-card-inner {
  padding: 8px;
}

.quoted-topic-card--compact .quote-unavailable {
  padding-block: 4px;
}

.quoted-topic-card--compact .quote-title,
.quoted-topic-card--compact .quote-content {
  margin-top: 4px;
}

.quoted-topic-card--compact .quote-content {
  gap: 8px;
}

.quoted-topic-card--compact .quote-side-media {
  width: 72px;
}

.quote-side-media {
  width: clamp(80px, 28%, 120px);
  aspect-ratio: 1;
}

.quote-side-media :deep(.forum-image-previewer),
.quote-side-media :deep(.forum-image-layout) {
  width: 100%;
  height: 100%;
}

.quote-wide-media :deep(.quote-wide-image) {
  height: 180px;
  max-height: none;
}
</style>
