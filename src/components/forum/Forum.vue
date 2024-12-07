<template>
  <ClientOnly>
    <div class="Forum slide-enter">
      <div class="forum-container">
        <div
          class="forum-content w-[clamp(calc(100%-240px),700px,55vw)] float-left"
        >
          <ForumHeader class="forum-header" />
          <Transition mode="out-in">
            <Suspense>
              <ForumTopicsList :data-loader="fetchData"></ForumTopicsList>

              <template #fallback>
                <div v-if="loading" class="flex justify-center w-full my-8">
                  <ReloadIcon class="w-4 h-4 mr-2 animate-spin v-middle" />
                  <p class="font-size-4 lh-[1]">
                    {{ theme.ui.button.loading }}
                  </p>
                </div>
              </template>
            </Suspense>
          </Transition>
          <div class="flex justify-center w-full my-8">
            <Button
              class="vp-link"
              variant="link"
              :disabled="loading"
              @click="loadMore"
              v-if="!noMore && data.length > 0"
            >
              <ReloadIcon
                class="w-4 h-4 mr-2"
                :class="loading ? 'animate-spin' : ''"
              />
              {{ theme.forum.loadMore }}
            </Button>
            <p
              v-else-if="noMore"
              class="font-size-3 c-[var(--vp-c-text-3)]"
              variant="link"
            >
              {{ theme.forum.noMore }}
            </p>
          </div>
        </div>
        <ForumAside />
        <Teleport to="body">
          <Button
            variant="outline"
            size="icon"
            @click="publishTopic()"
            class="forum-mobile-publish-btn important:vp-button rounded-full fixed bottom-4 right-4 size-[3.5rem]"
          >
            <span
              class="i-lucide-plus size-[1.75rem] shadow-[var(--vp-shadow-1)] z-9999"
            ></span>
          </Button>
        </Teleport>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import ForumHeader from './ForumHeader.vue'
import ForumTopicsList from './ForumTopicsList.vue'
import ForumAside from './ForumAside.vue'
import { provide, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-icons/vue'
import { useData } from 'vitepress'
import { issues } from '@/apis/forum/gitee'
import { useLoadMore } from '../../composables/useLoadMore'

import type ForumAPI from '@/apis/forum/api'

const { theme } = useData()

const page = ref(1)
const sort = ref<ForumAPI.Query['sort']>('updated')
const submittedTopic = ref<ForumAPI.Topic[]>([])
const topics = ref<ForumAPI.Topic[]>([])
const filterBy = ref<FilterType>('ALL')

const { data, runAsync, loading, loadMore, noMore, initialData } = useLoadMore(
  issues.getTopics,
  {
    manual: true,
  },
)

const fetchData = async () => {
  const data = await runAsync({
    current: page.value,
    sort: sort.value,
    pageSize: 20,
  })
}

const publishTopic = () => (location.hash = 'publish-topic')

const filterMap = {
  ALL: () => data.value,
  BUG: () => data.value.filter((val) => val?.type === 'BUG'),
  FEAT: () => data.value.filter((val) => val?.type === 'FEAT'),
}

type FilterType = keyof typeof filterMap

const filterTopic = (val?: FilterType) => {
  if (!val || !filterMap[val]) return
  topics.value = filterMap[val]()
}

async function searchTopics(q: string) {
  initialData()

  const result = await runAsync(
    {
      current: page.value,
      sort: sort.value,
      pageSize: 20,
    },
    q,
  )

  return result
}

watch(
  loading,
  () => {
    topics.value = data.value
  },
  {
    immediate: true,
  },
)

watch(sort, () => {
  runAsync({
    current: page.value,
    sort: sort.value,
    pageSize: 20,
  })
})

watch(filterBy, () => {
  return filterTopic(filterBy.value)
})

provide('sort', sort)
provide('searchTopics', searchTopics)
provide('topics', topics)
provide('submittedTopic', submittedTopic)
provide('loading', loading)
provide('filterBy', filterBy)
</script>

<style lang="scss" scoped>
$ForumAsideWidth: 248px;

.Forum {
  flex-grow: 1;
  flex-shrink: 0;
  margin: calc(var(--vp-layout-top-height, 0px) + 48px) auto 0;
  width: 100%;
  margin-bottom: 32px;
}

.forum-container {
  margin: 0 auto;
  padding: 0 32px;
}

@media (min-width: 1440px) {
  .forum-container {
    max-width: 945px;
    padding: 0;
  }
}

@media (min-width: 768px) {
  .Forum {
    padding-bottom: 96px;
  }

  .forum-mobile-publish-btn {
    display: none;
  }
}

@media (max-width: (768 + $ForumAsideWidth)) {
  .Forum {
    margin: 36px auto 0;
  }

  .forum-content {
    width: calc(100% - $ForumAsideWidth);
    margin-right: 1.5rem;
  }
}

@media (max-width: 768px) {
  .forum-content {
    width: calc(100%);
    margin-right: 1.5rem;
  }
}

@media (max-width: 468px) {
  .forum-content {
    width: 85vw;
    margin-right: 1.5rem;
  }
}
</style>
