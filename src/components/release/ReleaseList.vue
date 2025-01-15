<template>
  <div class="w-full">
    <div class="container">
      <ReleaseItem
        v-for="item in data"
        :key="item.version"
        :version="item.version"
        :description="item.description"
        :warning="item.warning"
        :type="item.type"
        :date="item.date"
        :fixed="item.fixed"
        :features="item.features"
        :breaking="item.breaking"
        :optimized="item.optimized"
        :actions="item.actions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ReleasesData } from './Release'
import ReleaseItem from './ReleaseItem.vue'

const { data } = defineProps<{
  data: ReleasesData
}>()

data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
</script>
