<script setup lang="ts">
import ReleaseList from './ReleaseList.vue'
import type { ReleasesData } from './Release'

defineProps<{
  data: ReleasesData
  title: string
  description: string
}>()
</script>

<template>
  <ReleaseList :data="data" />
</template>
