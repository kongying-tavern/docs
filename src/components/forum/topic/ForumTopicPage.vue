<script setup lang="ts">
import type { ForumTranslatorRef } from '../composables/useTopicTranslationMenu'
import { computed, ref, useTemplateRef } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumRoute } from '~/composables/useForumRoute'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import { useTopicTranslationMenu } from '../composables/useTopicTranslationMenu'
import ForumLayout from '../ForumLayout.vue'
import ForumAside from '../sidebar/ForumAside.vue'
import ForumImage from '../ui/ForumImage.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import ForumUserAtTag from '../user/ForumUserAtTag.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { useTopicPageState } from './composables/useTopicPageState'
import ForumTopicDropdownMenu from './ForumTopicDropdownMenu.vue'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'
import ForumTopicTagsEditorDialog from './ForumTopicTagsEditorDialog.vue'
import ForumTopicTranslator from './ForumTopicTranslator.vue'

const {
  topic,
  loading,
  error,
  retry,
  renderedContent,
  topicId,
  backToPreviousPage,
} = useTopicPageState()

const { message } = useLocalized()
const { userHref } = useForumRoute()
const translator = useTemplateRef<ForumTranslatorRef>('translator')
const translationMenu = useTopicTranslationMenu(topic, translator)
const translatedContent = ref('')
const translatedTitle = ref('')
const showingTranslation = ref(false)

const topicImages = computed(() => {
  if (!topic.value?.content?.images)
    return []

  return topic.value.content.images.map(img => ({
    src: img.src,
    alt: img.alt || '',
    thumbHash: img.thumbHash,
    width: img.width,
    height: img.height,
  }))
})

function showTranslatedContent(content: string): void {
  translatedContent.value = content
  showingTranslation.value = true
}

function handleTitleTranslated(title: string): void {
  translatedTitle.value = title
}
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #content>
        <div
          v-if="!loading && topic"
          class="slide-enter mb-4"
        >
          <div class="flex w-full items-center justify-between">
            <div class="text-14 flex flex-wrap gap-[0.25rem] min-w-0 items-center relative">
              <Button
                type="button"
                variant="ghost"
                :aria-label="message.forum.topic.backToPrevPage"
                class="mr-1 rounded-full bg-[var(--vp-c-bg-alt)] flex w-36px items-center max-sm:hidden"
                @click="backToPreviousPage()"
              >
                <span class="i-lucide-arrow-left icon-btn" aria-hidden="true" />
              </Button>
              <ForumUserHoverCard :user="topic.user">
                <template #trigger>
                  <User
                    size="sm"
                    :name="topic.user.username"
                    :to="userHref(topic.user.login)"
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
              <ForumTopicDropdownMenu
                side="bottom"
                :topic-data="topic"
                :menu="translationMenu"
                @topic:close="backToPreviousPage"
              />
            </div>
          </div>

          <h3
            v-if="topic.type !== 'BUG'"
            id="title"
            class="text-xl font-semibold m-0 mb-xs mt-2 break-words overflow-hidden md:text-1.5rem md:mb-1"
          >
            {{ showingTranslation && translatedTitle ? translatedTitle : topic.title }}
          </h3>

          <ForumTopicTypeBadge
            class="mt-3"
            :type="topic.type"
          />

          <ForumTopicTranslator
            ref="translator"
            class="font-size-4 line-height-6 -mb-3.5"
            :content="topic.content.text"
            :title="topic.title"
            :source-language="topic?.language"
            @translated="showTranslatedContent"
            @title-translated="handleTitleTranslated"
            @close="showingTranslation = false"
          />

          <article
            v-if="!showingTranslation"
            id="content"
            class="font-size-4 line-height-6 mt-3.5 opacity-99 whitespace-pre-wrap overflow-hidden"
            v-html="renderedContent"
          />
          <article
            v-else
            id="content"
            class="font-size-4 line-height-6 mt-3.5 opacity-99 whitespace-pre-wrap overflow-hidden"
          >
            {{ translatedContent }}
          </article>

          <ForumTagList
            class="my-2"
            :data="topic?.tags"
          />

          <ForumImage
            v-if="topicImages.length > 0"
            :images="topicImages"
            class="mt-6"
            :context="topic ? {
              kind: 'topic',
              topic,
              repo: topic.type === 'POST' ? 'Blog' : 'Feedback',
              topicAuthorId: topic.user.id,
            } : undefined"
          />

          <ForumTopicFooter
            :topic="topic"
          />
        </div>

        <div v-else-if="error" class="py-12 text-center" role="alert">
          <p class="c-[var(--vp-c-danger-1)]">
            {{ message.forum.errors.cannotLoadData }}
          </p>
          <Button type="button" class="mt-4" @click="retry()">
            {{ message.forum.auth.callback.error.retry }}
          </Button>
        </div>

        <ForumTopicSkeletonPage v-else />

        <Separator />

        <ForumCommentArea
          v-if="topic"
          class="mt-8"
          repo="Feedback"
          :topic-id="topicId"
          :topic="topic"
          :topic-author-id="topic?.user.id || -1"
          :comment-count="topic?.commentCount"
        />
      </template>

      <template #aside>
        <ForumAside
          :contact-us="true"
          :exclude-topic-ids="topic ? [topic.id] : []"
        />
      </template>
    </ForumLayout>

    <ForumTopicTagsEditorDialog />
  </ClientOnly>
</template>

<style scoped>
:deep(.forum-topic-paragraph-break) {
  display: block;
  content: '';
  margin-top: 0.75rem;
}
</style>
