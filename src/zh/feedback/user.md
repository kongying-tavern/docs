---
title: 我的反馈
layout: page
aside: false
---

<script setup lang="ts">
import { defineClientComponent } from 'vitepress'

const ForumUserPage = defineClientComponent(() => {
  return import('../../components/forum/user/ForumUserPage.vue')
})
</script>

<ForumUserPage />
