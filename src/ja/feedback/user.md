---
title: 私のフィードバック
layout: Forum
aside: false
footer: false
publishTopic: false
---

<script setup lang="ts">
import { defineClientComponent } from 'vitepress'

const ForumUserPage = defineClientComponent(() => {
  return import('../../components/forum/user/ForumUserPage.vue')
})
</script>

<ForumUserPage />
