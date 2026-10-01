<script setup lang="ts">
import type { ForumTranslatorRef } from '../composables/useTopicTranslationMenu'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { useForumTopicSeenState } from '~/forum/composables/state/useForumTopicSeenState'
import ForumAside from '../aside/ForumAside.vue'
import ForumCommentArea from '../comment/ForumCommentArea.vue'
import { useTopicTranslationMenu } from '../composables/useTopicTranslationMenu'
import ForumLayout from '../layout/ForumLayout.vue'
import ForumTopicMetadataControl from '../topic/ForumTopicMetadataControl.vue'
import { useTopicPageState } from './composables/useTopicPageState'
import ForumQuotedTopic from './ForumQuotedTopic.vue'
import ForumTopicDetailPanel from './ForumTopicDetailPanel.vue'
import ForumTopicDropdownMenu from './ForumTopicDropdownMenu.vue'
import ForumTopicFooter from './ForumTopicFooter.vue'
import ForumTopicTranslator from './ForumTopicTranslator.vue'

const { topic, loading, error, retry, renderedContent, topicId, backToPreviousPage } = useTopicPageState()

const { userHref } = useForumRoute()
const topicSeen = useForumTopicSeenState()
watch(topic, (value) => {
  if (value)
    topicSeen.markSeen(value.id)
})
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
        <ForumTopicDetailPanel
          :topic="topic" :loading="loading" :error="error"
          :author-href="topic ? userHref(topic.user.login) : ''"
          :rendered-content="renderedContent" :translated-content="translatedContent"
          :translated-title="translatedTitle" :showing-translation="showingTranslation"
          :topic-images="topicImages" @back="backToPreviousPage" @retry="retry"
        >
          <template v-if="topic" #menu>
            <ForumTopicDropdownMenu :topic-data="topic" :menu="translationMenu" side="bottom" @topic:close="backToPreviousPage" />
          </template>
          <template v-if="topic" #metadata>
            <ForumTopicMetadataControl :topic="topic" :type="topic.type" :topic-id="topic.id" :state="topic.state" :status="topic.status" :good-issue="topic.goodIssue" interactive />
          </template>
          <template v-if="topic" #translation>
            <ForumTopicTranslator ref="translator" :content="topic.content.text" :title="topic.title" :source-language="topic.language" @translated="showTranslatedContent" @title-translated="handleTitleTranslated" @close="showingTranslation = false" />
          </template>
          <template v-if="topic?.quotedTopic" #quote>
            <ForumQuotedTopic :reference="topic.quotedTopic" />
          </template>
          <template v-if="topic" #footer>
            <ForumTopicFooter :topic="topic" />
          </template>
          <template v-if="topic" #comments>
            <ForumCommentArea
              v-if="topic"
              repo="Feedback"
              :entry-animation="false"
              :topic-id="topicId"
              :topic="topic"
              :topic-author-id="topic?.user.id || -1"
              :comment-count="topic?.commentCount"
            />
          </template>
        </ForumTopicDetailPanel>
      </template>

      <template #aside>
        <ForumAside :topic="topic" />
      </template>
    </ForumLayout>
  </ClientOnly>
</template>
