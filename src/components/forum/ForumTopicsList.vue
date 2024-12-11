<template>
  <div>
    <ul>
      <!-- 基于审核和安全考虑，只展示发布超过两个小时的反馈 -->
      <li
        v-for="item in [
          ...submittedTopic,
          ...topics.filter(
            (val) =>
              Date.now() - new Date(val.createdAt).getTime() >=
              1000 * 60 * 60 * 2,
          ),
        ]"
      >
        <ForumTopic
          :content="item.content"
          :title="item.title"
          :author="item.user"
          :topic="item"
        ></ForumTopic>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import ForumTopic from './ForumTopic.vue'
import type ForumAPI from '@/apis/forum/api'

const { dataLoader: fetchData } = defineProps<{
  dataLoader: () => Promise<any>
}>()

await fetchData()

const topics = inject<ForumAPI.Topic[]>('topics')!
const submittedTopic = inject<ForumAPI.Topic[]>('submittedTopic')!
</script>
