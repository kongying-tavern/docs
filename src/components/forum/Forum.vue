<template>
  <ClientOnly>
    <ForumLayout>
      <template #header>
        <ForumHeader class="forum-header" />
      </template>

      <template #content>
        <Suspense>
          <ForumTopicsList :data-loader="refreshData"></ForumTopicsList>
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
  </ClientOnly>
</template>

<script setup lang="ts">
import ForumAside from './ForumAside.vue'
import ForumHeader from './ForumHeader.vue'
import ForumTopicsList from './ForumTopicsList.vue'
import ForumLayout from './ForumLayout.vue'
import ForumLoadState from './ForumLoadState.vue'
import { Button } from '@/components/ui/button'
import { useForumData } from '../../stores/useForumData'
import { useInfiniteScroll } from '@vueuse/core'

const forumData = useForumData()

const { refreshData, loadMore } = forumData

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
</script>
