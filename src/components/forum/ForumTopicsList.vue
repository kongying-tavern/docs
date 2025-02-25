<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import { computed } from 'vue'
import { useForumData } from '~/stores/useForumData'

import ForumTopic from './ForumTopic.vue'

const { dataLoader: fetchData, data } = defineProps<{
  data?: ForumAPI.Topic[]
  dataLoader?: () => Promise<any>
}>()

if (!import.meta.env.SSR && fetchData)
  await fetchData()

const renderData = computed(() => {
  if (data)
    return data

  const forumData = useForumData()

  return [
    ...(forumData.isSearching ? [] : forumData.userSubmittedTopic),
    ...(forumData.filter === 'ALL' && !forumData.isSearching
      ? forumData.annData || []
      : []),
    ...forumData.topics,
    // 基于审核和安全考虑，普通用户只展示发布超过两个小时的反馈
    // ...forumData.topics.filter(
    //   (val) =>
    //     Date.now() - new Date(val.createdAt).getTime() >= 1000 * 60 * 60 * 2 ||
    //     userInfo.isTeamMember(val.user.id).value,
    // ),
  ]
})
</script>

<template>
  <div>
    <ul>
      <li v-for="item in renderData" :key="item.id">
        <ForumTopic
          :content="item.content"
          :title="item.title"
          :author="item.user"
          :topic="item"
        />
      </li>
    </ul>
  </div>
</template>
