---
title: フィードバック
layout: page
aside: false
---

<script setup lang="ts">
import { defineClientComponent } from 'vitepress'

const Forum = defineClientComponent(() => {
  return import('../../components/forum/Forum.vue')
})
</script>

<Forum />
