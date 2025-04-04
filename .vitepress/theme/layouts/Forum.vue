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
  <Transition name="curtain">
    <ForumSearchCurtain v-if="openSearchCurtain" @close="openSearchCurtain = false" />
  </Transition>
  <Transition
    enter-active-class="transition duration-800 ease-out" leave-active-class="transition duration-800 ease-in"
    enter-from-class="opacity-0 blur-0" enter-to-class="opacity-100 blur-lg" leave-from-class="opacity-100 blur-lg"
    leave-to-class="opacity-0 blur-0"
  >
    <div
      v-if="openSearchCurtain"
      class="fixed inset-0 z-1 backdrop-blur-lg saturate-180 transition-filter duration-800"
    />
  </Transition>
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

.curtain-enter-active,
.curtain-leave-active {
  transition: all .8s ease;
}

.curtain-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.curtain-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.curtain-leave-from,
.curtain-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.curtain-enter-active .curtain-content,
.curtain-leave-active .curtain-content {
  transition: opacity .8s ease;
}

.curtain-enter-from .curtain-content,
.curtain-leave-to .curtain-content {
  opacity: 0;
}

.curtain-leave-from .curtain-content,
.curtain-enter-to .curtain-content {
  opacity: 1;
}
</style>
