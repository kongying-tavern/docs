<template>
  <Giscus
    v-if="frontmatter.comment !== false && frontmatter.layout == 'doc'"
    repo="kongying-tavern/docs"
    repo-id="MDEwOlJlcG9zaXRvcnkzNzkxODc0NDQ="
    category="Announcements"
    category-id="MDE4OkRpc2N1c3Npb25DYXRlZ29yeTMzMDUwMjk4"
    mapping="title"
    term="Kongying Tavern Doc"
    strict="1"
    reactions-enabled="1"
    emit-metadata="0"
    input-position="top"
    :theme="[isDark ? '/themes/dark.css' : '/themes/light.css']"
    :lang="lang"
    loading="lazy"
  />
</template>

<script setup lang="ts">
import Giscus from '@giscus/vue'
import { useData } from 'vitepress'

const { isDark, frontmatter, lang } = useData()
</script>

<style second></style>
