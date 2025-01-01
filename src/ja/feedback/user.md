---
title: 私のフィードバック
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
