<script setup lang="ts">
import type { ReleasesData } from './Release'
import ReleaseList from './ReleaseList.vue'

defineProps<{
  data: ReleasesData
  title: string
  description: string
}>()
</script>

<template>
  <ReleaseList :data="data" />
</template>
