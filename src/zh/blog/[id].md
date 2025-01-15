---
docInfo: false
layout: doc
outline: false
aside: false
docHeader: false
---

<ForumBlogPostHeader
  :title="params.title"
  :date="params.updatedAt"
  :author="params.author"
  :description="params.description"
/>

<!-- @content -->

<ForumTopicFooter prev-page-link="../" :text="message.forum.topic.backToTeamBlog" />

<div class="my-2 vp-divider" />

<ForumCommentArea
  class="mt-8"
  repo="blog"
  v-if="params.commentCount !== -1"
  :topic-id="params.id"
  :topic-author-id="params.author.id"
/>

<script setup lang="ts">
import { defineClientComponent } from 'vitepress'
import ForumTopicFooter from '~/components/forum/topic/ForumTopicFooter.vue'
import ForumBlogPostHeader from '~/components/forum/blog/ForumBlogPostHeader.vue'

const ForumCommentArea = defineClientComponent(() => {
  return import('~/components/forum/ForumCommentArea.vue')
})

import { useLocalized } from '@/hooks/useLocalized'

const { message } = useLocalized()

import { useData } from 'vitepress'

const { params } = useData()

if(!import.meta.env.SSR) {
  document.title = document.title.replace('VitePress', params.value.title)
}
</script>
