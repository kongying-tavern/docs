---
title: 个人主页
layout: Forum
aside: false
publishTopic: false
---

<script setup lang="ts">
import { defineClientComponent } from 'vitepress'

const ForumUserPage = defineClientComponent(() => {
  return import('../../components/forum/user/ForumUserPage.vue')
})
</script>

<ForumUserPage />
