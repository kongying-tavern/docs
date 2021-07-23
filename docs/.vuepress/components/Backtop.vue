<template>
  <ElTooltip
    effect="dark"
    placement="left-start"
    :enterable="false"
    :content="backToTop"
  >
    <ElBacktop :visibility-height="300" :right="30" class="docs-backtop">
      <SvgIcon name="back-top" />
    </ElBacktop>
  </ElTooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'

import type { ThemeData } from '../shared'

const themeLocaleData = useThemeLocaleData<ThemeData>()
const backToTop = ref(themeLocaleData.value.backToTop)
</script>

<style lang="scss" scoped>
.docs-backtop {
  z-index: 99999;
  display: grid;
  place-items: center;
  opacity: 0.7;
  background-color: var(--docs-backtop);
  border: var(--docs-border);
  &:hover {
    opacity: 1;
    background-color: var(--docs-backtop);
    transition: all 0.3s;
  }
  svg {
    filter: var(--docs-icon);
  }
}

@media only screen and (max-width: 980px) {
  .docs-backtop {
    display: none;
  }
}
</style>
