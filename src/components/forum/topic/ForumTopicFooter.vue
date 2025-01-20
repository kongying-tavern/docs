<template>
  <div class="flex items-center justify-between mt-12">
    <VPLink class="vp-link important:no-underline" :href="prevPageLink"
      >← {{ text }}
    </VPLink>

    <ForumShareThis />
  </div>
</template>

<script setup lang="ts">
import ForumShareThis from '../ForumShareThis.vue'
import { useData } from 'vitepress'

defineProps<{
  prevPageLink: string
  text: string
}>()
</script>
