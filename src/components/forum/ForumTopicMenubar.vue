<script setup lang="ts">
import ForumTopicSortDropdown from './ForumTopicSortDropdown.vue'
import ForumTopicTypeDropdown from './ForumTopicTypeDropdown.vue'
import ForumTopicViewDropdown from './ForumTopicViewDropdown.vue'
</script>

<template>
  <div class="h-32px flex">
    <div class="flex items-center">
      <ForumTopicTypeDropdown />
      <ForumTopicSortDropdown />
      <ForumTopicViewDropdown />
    </div>
  </div>
</template>
