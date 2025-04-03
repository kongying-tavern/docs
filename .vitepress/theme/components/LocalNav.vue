<script lang="ts" setup>
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { useSidebar } from 'vitepress/theme'
import { computed, onMounted, ref } from 'vue'

defineProps<{
  class?: HTMLAttributes['class']
}>()

const { hasSidebar } = useSidebar()

const navHeight = ref(0)

onMounted(() => {
  navHeight.value = Number.parseInt(
    getComputedStyle(document.documentElement).getPropertyValue(
      '--vp-nav-height',
    ),
  )
})

const classes = computed(() => {
  return {
    'VPLocalNav': true,
    'has-sidebar': hasSidebar.value,
  }
})
</script>

<template>
  <div
    :class="cn(classes, $props.class)"
  >
    <div class="wrapper">
      <div class="container">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.VPLocalNav {
  position: sticky;
  top: 0;
  /*rtl:ignore*/
  left: 0;
  z-index: var(--vp-z-index-local-nav);
  border-bottom: 1px solid var(--vp-c-gutter);
  width: 100%;
  background-color: var(--vp-local-nav-bg-color);
  margin-top: 0px;
}

.VPLocalNav.fixed {
  position: fixed;
}

@media (min-width: 960px) {

  .VPLocalNav.has-sidebar {
    padding-left: var(--vp-sidebar-width);
  }

  .VPLocalNav.empty {
    display: none;
  }
}

@media (min-width: 1440px) {
  .VPLocalNav.has-sidebar {
    padding-left: calc((100vw - var(--vp-layout-max-width)) / 2 + var(--vp-sidebar-width));
  }
}

.wrapper {
  padding: 0 8px 0 24px;
}

@media (min-width: 768px) {
  .wrapper {
    padding: 0 32px;
  }
}

.container {
  display: flex;
  justify-content: space-between;
  margin: 0 auto;
  max-width: calc(var(--vp-layout-max-width) - 64px);
  height: var(--locale-nav-height);
  pointer-events: none;
}

.container > .title,
.container > .content {
  pointer-events: none;
}

.container :deep(*) {
  pointer-events: auto;
}
</style>
