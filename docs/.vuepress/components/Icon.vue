<template>
  <svg class="docs-icon" aria-hidden="true" @click="(e) => $emit('click', e)">
    <use :xlink:href="'#' + icon"></use>
  </svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

/**
 * @description: icon预览地址 https://yuanshen.site/docs/20210619/demo_index.html
 */

export default defineComponent({
  name: 'docs-icon',
  props: {
    icon: { type: String, required: true }, //图标名称
  },
})
</script>

<style lang="scss">
.docs-icon {
  color: inherit;
  font-size: inherit;
  box-sizing: border-box;
  outline: none;

  /*阿里巴巴icon设置*/
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor;
  overflow: hidden;
}
</style>
