---
title: コミュニティ
layout: doc
outline: false
---

## Community

<LinkGrid :items="server" />

<script setup lang="ts">
import { onMounted } from 'vue'
import { serverLink } from '../components/links/Community'

const server = [
  serverLink('discord', 'Discord')
]
</script>
