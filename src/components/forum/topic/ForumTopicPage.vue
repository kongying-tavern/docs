<script setup lang="ts">
import { Button } from '@/components/ui/button'
import Image from '@/components/ui/image/Image.vue'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import ForumAside from '../ForumAside.vue'
import ForumLayout from '../ForumLayout.vue'
import ForumTopicDropdownMenu from '../ForumTopicDropdownMenu.vue'
import ForumTopicTranslator from '../ForumTopicTranslator.vue'
import ForumRoleBadge from '../ui/ForumRoleBadge.vue'
import ForumTagList from '../ui/ForumTagList.vue'
import ForumTime from '../ui/ForumTime.vue'
import ForumTopicTypeBadge from '../ui/ForumTopicTypeBadge.vue'
import ForumUserHoverCard from '../user/ForumUserHoverCard.vue'
import { useTopicImageGrid } from './composables/useTopicImageGrid'
import { useTopicPageState } from './composables/useTopicPageState'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicSkeletonPage from './ForumTopicSkeletonPage.vue'

// Topic page state management
const {
  topic,
  loading,
  renderedContent,
  params,
  message,
  backToPreviousPage,
} = useTopicPageState()

// Image grid functionality
const { gridClass, imageClass } = useTopicImageGrid(topic)
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

          <div v-if="topic?.content.images" class="topic-content-img grid mt-6 w-full gap-1 overflow-hidden rounded-sm" :class="gridClass">
            <Image
              v-for="(img, index) in topic?.content.images" :key="index" :src="img.src" :alt="img.alt"
              :thumb-hash="img?.thumbHash" :width="img?.width" :height="img?.height" class="size-full" :class="imageClass(index)"
            />
          </div>

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
  </ClientOnly>
</template>
