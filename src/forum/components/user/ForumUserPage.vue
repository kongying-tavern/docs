<script setup lang="ts">
import type { FORUM } from '../types'
import { computed, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useArchivedFeedbackAccess } from '~/forum/composables/auth/useArchivedFeedbackAccess'
import { useForumTopicsQuery } from '~/forum/composables/data/useForumQueries'
import { useForumRoute } from '~/forum/composables/state/useForumRoute'
import { resolveForumListScope } from '~/forum/services/forumListSkeleton'
import { parseForumSearchQuery } from '~/forum/services/forumSearchQuery'
import ForumAside from '../aside/ForumAside.vue'
import ForumListPage from '../layout/ForumListPage.vue'
import ForumListQuickControls from '../list/ForumListQuickControls.vue'
import ForumTopicSearchInfo from '../search/ForumTopicSearchInfo.vue'
import ForumProfileResultsPanel from './ForumProfileResultsPanel.vue'
import ForumUserProfileHeader from './ForumUserProfileHeader.vue'
import ForumUserProfileHeaderSkeleton from './ForumUserProfileHeaderSkeleton.vue'

const { route, list, navigateFilter, navigateType, navigateSort } = useForumRoute()
const { message } = useLocalized()

const username = computed(() => route.value?.name === 'user' ? route.value.username : '')
const canViewArchived = useArchivedFeedbackAccess(username)
const feedbackFilter = computed(() => {
  const filter = list.value?.filter
  return filter === 'closed' || (filter === 'archived' && canViewArchived.value) ? filter : 'all'
})
const activeTab = computed<FORUM.ProfileTab['id']>({
  get: () => feedbackFilter.value,
  set: filter => void navigateFilter(filter),
})
// Unsupported or no longer authorized tabs fall back to the default list.
watch([() => list.value?.filter, canViewArchived], ([filter]) => {
  if (route.value?.name === 'user' && filter && filter !== feedbackFilter.value)
    void navigateFilter('all')
}, { immediate: true })

const search = computed(() => parseForumSearchQuery(list.value?.q ?? ''))
const topics = useForumTopicsQuery(computed(() => ({
  filter: feedbackFilter.value,
  topicType: list.value?.topicType ?? 'all',
  sort: list.value?.sort ?? 'created',
  q: search.value.text,
  tags: search.value.tags,
  statuses: search.value.states,
  creator: feedbackFilter.value === 'archived' ? username.value : search.value.author ?? username.value,
})), true, computed(() => resolveForumListScope(route.value)))
// 主页头部数量：该用户的全部反馈（不分类型/状态），不跟随下方筛选
const allTopicsCount = useForumTopicsQuery(computed(() => ({
  filter: 'all',
  sort: 'created',
  q: '',
  creator: username.value,
  state: 'all',
  pageSize: 1,
})), computed(() => Boolean(username.value)))
const loadStateMessage = computed(() => {
  if (topics.error.value)
    return message.value.forum.loadError
  return topics.canLoadMore.value ? message.value.forum.loadMore : message.value.forum.noMore
})
function login(): void {
  location.hash = 'login-alert'
}
</script>

<template>
  <ForumListPage
    :render-data="topics.rows.value"
    :loading="topics.isLoading.value"
    :loading-more="topics.loadingMore.value"
    :error="topics.error.value"
    :can-load-more="topics.canLoadMore.value"
    :load-more="topics.loadMore"
    :refresh-data="topics.refetch"
    :load-state-message="loadStateMessage"
    :show-toolbar="false"
    @login="login"
  >
    <template #header>
      <Suspense>
        <ForumUserProfileHeader
          v-model:active-tab="activeTab"
          :username="username"
          :topic-count="allTopicsCount.total.value"
          :suggestions="topics.rows.value"
        />

        <template #fallback>
          <ForumUserProfileHeaderSkeleton />
        </template>
      </Suspense>
    </template>

    <template #content-before>
      <ForumListQuickControls
        :sort="list?.sort ?? 'created'"
        :topic-type="list?.topicType ?? 'all'"
        @sort-change="navigateSort"
        @type-change="navigateType"
      />
      <ForumTopicSearchInfo
        :loading="topics.isLoading.value"
        :total="topics.total.value"
      />
    </template>

    <template #content-main>
      <ForumProfileResultsPanel
        :active-tab="activeTab" :data="topics.rows.value"
        :loading="topics.isLoading.value" :loading-more="topics.loadingMore.value"
        :error="topics.error.value" :can-load-more="topics.canLoadMore.value"
        :sort="list?.sort ?? 'created'" :query="list?.q ?? ''"
        :load-more="topics.loadMore" :refresh-data="topics.refetch" :text="loadStateMessage"
        @login="login"
      />
    </template>

    <template #aside>
      <ForumAside :username="username" />
    </template>
  </ForumListPage>
</template>
