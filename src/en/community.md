---
title: Join Community
layout: doc
---

## Community Server

<LinkGrid :items="server" />

<script setup lang="ts">
import { serverLink } from '../components/links/Community'

const server = [
  serverLink('discord', 'Discord')
]
</script>

<style lang="scss" scoped>
@use '../components/links/Community.scss';
@include Community.main;
</style>
