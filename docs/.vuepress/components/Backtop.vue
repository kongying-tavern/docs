<template>
  <el-tooltip
    effect="dark"
    :enterable="false"
    :content="backToTop"
    placement="left-start"
  >
    <el-backtop :visibility-height="300" :right="30" class="docs-backtop">
      <Icon icon="back-top" />
    </el-backtop>
  </el-tooltip>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'

import type { ThemeData } from '@vuepress/plugin-theme-data/lib/client'

type MyThemeData = ThemeData<{
  backToTop: string
}>

export default defineComponent({
  name: 'Backtop',
  setup() {
    const themeLocaleData = useThemeLocaleData<MyThemeData>()
    return {
      backToTop: themeLocaleData.value.backToTop,
    }
  },
})
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
