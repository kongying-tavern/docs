<script setup lang="ts">
import { useStyleTag } from '@vueuse/core'
import { onMounted, onUnmounted, ref } from 'vue'
import ForumLocalNav from '~/components/forum/ForumLocalNav.vue'
import ForumSearchCurtain from '~/components/forum/ForumSearchCurtain.vue'
import ForumTopicTagsEditorDialog from '~/components/forum/ForumTopicTagsEditorDialog.vue'

const { load, unload } = useStyleTag('.VPNav { position: relative !important; }\n#VPContent { padding-top: 0 !important;')

const openSearchCurtain = ref(false)

onMounted(load)
onUnmounted(unload)
</script>

<template>
  <ForumLocalNav v-model:open-search-curtain="openSearchCurtain" />
  <ForumSearchCurtain v-if="openSearchCurtain" @close="openSearchCurtain = false" />
  <div class="slide-enter Forum">
    <slot />
    <Content />
  </div>
  <Teleport to="body">
    <ForumTopicTagsEditorDialog />
  </Teleport>
</template>

<style>
.Forum>.VPLocalNav {
  display: none;
}
</style>

<style lang="scss" scoped>
.Forum {
  flex-grow: 1;
  flex-shrink: 0;
  margin: calc(var(--vp-layout-top-height, 0px) + 28px) auto 0;
  width: 100%;
  margin-bottom: 32px;
}
</style>
