<script setup lang="ts">
import ForumShareThis from '../ForumShareThis.vue'

defineProps<{
  prevPageLink: string
  text: string
}>()
</script>

<template>
  <div class="mt-12 flex items-center justify-between">
    <VPLink class="vp-link important:no-underline" :href="prevPageLink">
      ← {{ text }}
    </VPLink>

    <ForumShareThis />
  </div>
</template>
