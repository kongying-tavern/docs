<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <ForumHeader class="forum-header" />
      </template>

      <template #content>
        <Suspense>
          <ForumTopicsList></ForumTopicsList>
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

<script setup lang="ts">
import ForumAside from './ForumAside.vue'
import ForumHeader from './ForumHeader.vue'
import ForumTopicsList from './ForumTopicsList.vue'
import ForumLayout from './ForumLayout.vue'
import ForumLoadState from './ForumLoadState.vue'
import ForumPublishTopicForm from './publish-topic-form/ForumPublishTopicForm.vue'
import { useForumData } from '~/stores/useForumData'
import { useInfiniteScroll } from '@vueuse/core'
import { onMounted } from 'vue'

const forumData = useForumData()

const { loadMore } = forumData

const init = () => {
  if (import.meta.env.SSR) return null

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

onMounted(() => {
  init()
})
</script>
