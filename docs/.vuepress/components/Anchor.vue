<template>
  <Toc class="docs-anchor" />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Anchor',
})
</script>

<style lang="scss">
.vuepress-toc.docs-anchor {
  position: fixed;
  top: 115px;
  right: 20px;
  ul.vuepress-toc-list {
    list-style: none;
    font-size: 12px;
    max-width: 125px;
    min-width: 92px;
    max-height: 80vh;
    border-left: 1px solid var(--c-border-dark);
    margin: 0;
    li.vuepress-toc-item {
      a {
        color: var(--text-color);
        opacity: 0.85;
        &:hover {
          opacity: 1;
          color: var(--c-text-accent);
          transition: all 0.3s;
        }
      }
      a.router-link-active.active {
        color: var(--c-text-accent);
      }
      &:not(:last-child) {
        margin-bottom: 4px;
      }
      &:empty,
      & > .vuepress-toc-list {
        display: none;
      }
    }
  }
}

ul.vuepress-toc-list > li.vuepress-toc-item:nth-last-child(1):first-child {
  // 只有一个item时隐藏
  display: none;
}

@media only screen and (max-width: 1280px) {
  .docs-anchor {
    display: none;
  }
}
</style>
