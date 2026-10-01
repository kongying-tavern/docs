<script setup lang="ts">
import ForumSearchPanel from './ForumSearchPanel.vue'
import { useSearchPageController } from './useSearchPageController'

const controller = useSearchPageController()
</script>

<template>
  <ForumSearchPanel v-bind="controller" />
</template>
