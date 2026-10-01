<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { usePublishTopicController } from '../composables/usePublishTopicController'
import ForumPublishTopicPanel from './ForumPublishTopicPanel.vue'

const panel = useTemplateRef<InstanceType<typeof ForumPublishTopicPanel>>('panel')
const controller = usePublishTopicController(() => panel.value)
</script>

<template>
  <ForumPublishTopicPanel ref="panel" v-bind="controller" />
</template>
