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
        <div v-if="!loading && topic" class="slide-enter mb-4">
          <div class="w-full flex items-center justify-between">
            <div class="relative min-w-0 flex flex-wrap items-center gap-[0.25rem] text-14">
              <Button variant="ghost" class="mr-1 w-36px flex items-center rounded-full bg-[var(--vp-c-bg-alt)] max-sm:hidden" @click="backToPreviousPage()">
                <span class="i-lucide-arrow-left icon-btn" />
              </Button>
              <ForumUserHoverCard :user="topic.user">
                <template #trigger>
                  <User size="sm" :name="topic.user.username" :to="`../user/${topic.user.login}`" :avatar="{ src: topic.user.avatar, alt: topic.user.login }" />
                </template>
              </ForumUserHoverCard>
              <ForumRoleBadge :author-id="topic.user.id" />
              <span class="my-0 inline-block text-xs color-[--vp-c-text-3]">•</span>
              <ForumTime
                class="text-xs color-[--vp-c-text-3] font-[var(--vp-font-family-subtitle)]"
                :date="topic.createdAt"
              />
            </div>

            <ForumTopicDropdownMenu side="bottom" :topic-data="topic" @topic:close="backToPreviousPage" />
          </div>

          <h3 v-if="topic.type !== 'BUG'" id="title" class="m-0 mb-xs mt-2 overflow-hidden break-words text-xl font-semibold md:mb-1 md:text-1.5rem">
            {{ topic.title }}
          </h3>

          <ForumTopicTypeBadge class="mt-3" :type="topic.type" />

          <article
            id="content" class="mt-3.5 overflow-hidden whitespace-pre-wrap font-size-4 line-height-6 opacity-99"
            v-html="renderedContent"
          />

          <ForumTopicTranslator
            class="font-size-4 line-height-6" :content="renderedContent"
            :source-language="topic?.language"
          />

          <ForumTagList class="my-2" :data="topic?.tags" />

          <!-- 智能图片布局 -->
          <Images
            v-if="topicImages.length > 0"
            :images="topicImages"
            class="mt-6"
          />

          <ForumTopicFooter prev-page-link="./" :topic-id="String(topic.id)" :text="message.forum.topic.backToFeedbackForum" />
        </div>

        <ForumTopicSkeletonPage v-else />

        <div class="vp-divider" />

        <ForumCommentArea
          class="mt-8" repo="Feedback" :topic-id="params?.id" :topic-author-id="topic?.user.id || -1"
          :comment-count="topic?.commentCount"
        />
      </template>

      <template #aside>
        <ForumAside :show-button="false" :contact-us="true" />
      </template>
    </ForumLayout>

    <!-- Tags Editor Dialog -->
    <ForumTopicTagsEditorDialog />
  </ClientOnly>
</template>
