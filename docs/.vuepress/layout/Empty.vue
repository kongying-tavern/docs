<template>
  <Navbar></Navbar>
</template>

<script lang="ts">
import { ref } from 'vue'
import { usePageFrontmatter } from '@vuepress/client'
import Navbar from '@vuepress/theme-default/lib/client/components/Navbar.vue'
export default {
  components: {
    Navbar,
  },
  setup() {
    const frontmatter = usePageFrontmatter()
    return {}
  },
}
</script>

<style lang="scss"></style>
