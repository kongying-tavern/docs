<template>
  <Layout>
    <template #page-top>
      <Anchor v-show="anchor" />
      <Backtop />
    </template>
    <template #page-bottom>
      <footer class="docs-footer page-meta">
        <div class="footer-container" role="presentation">
          <FollowUs />
          <Grade />
          <div class="docs-info">Chinese hoyolab Made By Kongying Tavern</div>
        </div>
      </footer>
    </template>
  </Layout>
</template>

<script lang="ts">
import { ref } from 'vue'
import { usePageFrontmatter } from '@vuepress/client'
import { useThemeLocaleData } from '@vuepress/plugin-theme-data/lib/client'
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'

import type { ThemeData } from '@vuepress/plugin-theme-data/lib/client'

export default {
  components: {
    Layout,
  },
  setup() {
    const frontmatter = usePageFrontmatter()
    return {
      anchor: ref(frontmatter.value.anchor ?? true),
    }
  },
}
</script>

<style lang="scss">
.footer-container {
  .docs-info {
    display: grid;
    place-items: center;
    padding-top: 20px;
    text-align: center;
  }
}
</style>
