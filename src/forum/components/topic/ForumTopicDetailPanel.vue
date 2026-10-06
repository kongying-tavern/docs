<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import User from '@/components/ui/User.vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumEmptyActions from '../ui/ForumEmptyActions.vue'
import ForumEmptyIllustration from '../ui/ForumEmptyIllustration.vue'
import ForumImage from '../ui/ForumImage.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTime from '../ui/ForumTime.vue'
import ForumUserAtTag from '../user/ForumUserAtTag.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import ForumTopicPageSkeleton from './ForumTopicPageSkeleton.vue'

const { topic, loading, error, authorHref, renderedContent, translatedContent, translatedTitle, showingTranslation, topicImages } = defineProps<{
  topic?: ForumAPI.Topic
  loading: boolean
  error?: Error | null
  authorHref: string
  renderedContent: string
  translatedContent: string
  translatedTitle: string
  showingTranslation: boolean
  topicImages: ForumAPI.ImageInfo[]
}>()
const emit = defineEmits<{ back: [], retry: [] }>()
const { message } = useLocalized()
</script>

<template>
  <div
    v-if="!loading && topic"
    class="mb-4"
  >
    <div class="flex w-full items-center justify-between">
      <div class="text-14 flex flex-wrap gap-[0.25rem] min-w-0 items-center relative">
        <Button
          type="button"
          variant="ghost"
          :aria-label="message.forum.topic.backToPrevPage"
          class="mr-1 rounded-full bg-[var(--vp-c-bg-alt)] flex w-36px items-center max-sm:hidden"
          @click="emit('back')"
        >
          <span class="i-lucide-arrow-left icon-btn" aria-hidden="true" />
        </Button>
        <ForumUserHoverCard :user="topic.user">
          <template #trigger>
            <User
              :data-forum-user="topic.user.login"
              data-forum-shared-topic="author"
              size="sm"
              :name="topic.user.username"
              :to="authorHref"
              :avatar="{ src: topic.user.avatar, alt: topic.user.login }"
            />
          </template>
        </ForumUserHoverCard>
        <ForumUserAtTag :user="topic.user" />
      </div>

      <div class="flex shrink-0 gap-2 items-center">
        <ForumTime
          class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)] whitespace-nowrap"
          :date="topic.createdAt"
        />
        <slot name="menu" />
      </div>
    </div>

    <h3
      v-if="topic.type !== 'BUG'"
      id="title"
      data-forum-shared-topic="title"
      class="text-xl font-semibold m-0 mb-xs mt-1 break-words overflow-hidden md:text-1.5rem md:mb-1"
    >
      {{ showingTranslation && translatedTitle ? translatedTitle : topic.title }}
    </h3>

    <div class="mt-3" data-forum-shared-topic="type">
      <slot name="metadata" />
    </div>

    <div class="font-size-4 line-height-6 -mb-3.5">
      <slot name="translation" />
    </div>

    <article
      v-if="!showingTranslation"
      id="content"
      data-forum-shared-topic="content"
      class="font-size-4 line-height-6 mt-3.5 opacity-99 whitespace-pre-wrap overflow-hidden"
      v-html="renderedContent"
    />
    <article
      v-else
      id="content"
      data-forum-shared-topic="content"
      class="font-size-4 line-height-6 mt-3.5 opacity-99 whitespace-pre-wrap overflow-hidden"
    >
      {{ translatedContent }}
    </article>

    <ForumTagList
      class="my-2"
      :data="topic?.tags"
    />

    <div v-if="topicImages.length > 0" data-forum-shared-topic="image">
      <ForumImage
        :images="topicImages"
        class="mt-6"
        :context="topic ? {
          kind: 'topic',
          topic,
          repo: 'Feedback',
          topicAuthorId: topic.user.id,
        } : undefined"
      />
    </div>

    <div v-if="$slots.quote" class="mt-4">
      <slot name="quote" />
    </div>

    <slot name="footer" />
  </div>

  <div v-else-if="error" class="py-12" role="alert">
    <Empty class="forum-empty-state border-none">
      <EmptyHeader>
        <EmptyMedia>
          <ForumEmptyIllustration variant="error" />
        </EmptyMedia>
        <EmptyTitle>
          {{ message.forum.loadError }}
        </EmptyTitle>
        <EmptyDescription>
          {{ message.forum.errors.loadFailedHint }}
        </EmptyDescription>
      </EmptyHeader>
      <ForumEmptyActions>
        <Button @click="emit('retry')">
          <span class="i-lucide-refresh-cw icon-btn" aria-hidden="true" />
          {{ message.forum.auth.callback.error.retry }}
        </Button>
      </ForumEmptyActions>
    </Empty>
  </div>

  <ForumTopicPageSkeleton v-else />
  <div v-if="$slots.comments" class="mt-8">
    <slot name="comments" />
  </div>
</template>
