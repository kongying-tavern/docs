<script setup lang="ts">
import { useInfiniteScroll } from '@vueuse/core'

import { useForumData } from '~/stores/useForumData'
import ForumAside from './ForumAside.vue'
import ForumHeader from './ForumHeader.vue'
import ForumLayout from './ForumLayout.vue'
import ForumLoadState from './ForumLoadState.vue'
import ForumTopicsList from './ForumTopicsList.vue'
import ForumPublishTopicForm from './publish-topic-form/ForumPublishTopicForm.vue'

const forumData = useForumData()

const { loadMore } = forumData

if (!import.meta.env.SSR) {
  forumData.loadForumData()

  useInfiniteScroll(
    window,
    () => {
      loadMore()
    },
    {
      distance: 10,
      interval: 1500,
      canLoadMore: () => forumData.canLoadMore,
    },
  )
}
</script>

<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <ForumHeader class="forum-header" />
      </template>

      <template #content>
        <Suspense>
          <ForumTopicsList />
        </Suspense>

        <ForumLoadState
          :loading="forumData.loading"
          :text="forumData.loadStateMessage"
        />
      </template>

      <template #aside>
        <ForumAside />
      </template>
    </ForumLayout>
    <Teleport to="body">
      <ForumPublishTopicForm />
    </Teleport>
  </ClientOnly>
</template>
