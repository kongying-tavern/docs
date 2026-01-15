<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Images } from '@/components/ui/image'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumTopicTagsEditorDialog from '../ForumTopicTagsEditorDialog.vue'
import ForumTopicTranslator from '../ForumTopicTranslator.vue'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { useTopicPageState } from './composables/useTopicPageState'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'

// 组件元数据配置
defineOptions({
  meta: {
    i18n: true,
  },
})

const {
  topic,
  loading,
  renderedContent,
  params,
  message,
  backToPreviousPage,
} = useTopicPageState()

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
                variant="ghost"
                class="mr-1 rounded-full bg-[var(--vp-c-bg-alt)] flex w-36px items-center max-sm:hidden"
                @click="backToPreviousPage()"
              >
                <span class="i-lucide-arrow-left icon-btn" />
              </Button>
              <ForumUserHoverCard :user="topic.user">
                <template #trigger>
                  <User
                    size="sm"
                    :name="topic.user.username"
                    :to="`../user/${topic.user.login}`"
                    :avatar="{ src: topic.user.avatar, alt: topic.user.login }"
                  />
                </template>
              </ForumUserHoverCard>
              <ForumRoleBadge :author-id="topic.user.id" />
              <span class="text-xs color-[--vp-c-text-3] my-0 inline-block">•</span>
              <ForumTime
                class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
                :date="topic.createdAt"
              />
            </div>

            <ForumTopicDropdownMenu
              side="bottom"
              :topic-data="topic"
              @topic:close="backToPreviousPage"
            />
          </div>

          <h3
            v-if="topic.type !== 'BUG'"
            id="title"
            class="text-xl font-semibold m-0 mb-xs mt-2 break-words overflow-hidden md:text-1.5rem md:mb-1"
          >
            {{ topic.title }}
          </h3>

          <ForumTopicTypeBadge
            class="mt-3"
            :type="topic.type"
          />

          <article
            id="content"
            class="font-size-4 line-height-6 mt-3.5 opacity-99 whitespace-pre-wrap overflow-hidden"
            v-html="renderedContent"
          />

          <ForumTopicTranslator
            class="font-size-4 line-height-6"
            :content="renderedContent"
            :source-language="topic?.language"
          />

          <ForumTagList
            class="my-2"
            :data="topic?.tags"
          />

          <!-- 智能图片布局 -->
          <Images
            v-if="topicImages.length > 0"
            :images="topicImages"
            class="mt-6"
          />

          <ForumTopicFooter
            prev-page-link="./"
            :topic-id="String(topic.id)"
            :text="message.forum.topic.backToFeedbackForum"
          />
        </div>

        <ForumTopicSkeletonPage v-else />

        <Separator />

        <ForumCommentArea
          class="mt-8"
          repo="Feedback"
          :topic-id="params?.id"
          :topic-author-id="topic?.user.id || -1"
          :comment-count="topic?.commentCount"
        />
      </template>

      <template #aside>
        <ForumAside
          :show-button="false"
          :contact-us="true"
        />
      </template>
    </ForumLayout>

    <!-- Tags Editor Dialog -->
    <ForumTopicTagsEditorDialog />
  </ClientOnly>
</template>
