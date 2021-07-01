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
.docs-anchor {
  position: fixed;
  top: 115px;
  right: 20px;
  ul {
    list-style: none;
    font-size: 12px;
    max-width: 125px;
    min-width: 92px;
    max-height: 80vh;
    border-left: 1px solid var(--c-border-dark);
    margin: 0;
    li {
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
      ul {
        display: none;
      }
    }
  }
}
</style>
