---
title: Join Community
layout: doc
---

## Community

<LinkGrid :items="server" />

<script setup lang="ts">
import { useUrlSearchParams } from '@vueuse/core'
import { onMounted } from 'vue'
import { serverLink, serverJump } from '../components/links/Community'

const server = [
  serverLink('discord', 'Discord')
]
</script>

<style lang="scss" scoped>
@use '../components/links/Community.scss';
@include Community.main;
</style>
