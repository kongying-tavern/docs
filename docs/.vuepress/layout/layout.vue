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

<script setup lang="ts">
import { ref } from 'vue'
import { usePageFrontmatter } from '@vuepress/client'
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'

const frontmatter = usePageFrontmatter()
const anchor = ref(frontmatter.value.anchor ?? true)
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
