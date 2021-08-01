<template>
  <Layout>
    <!-- <template #page-top>
      <Anchor v-show="anchorRight" />
      <Backtop v-show="backTop" />
    </template> -->
    <template #page-bottom>
      <footer class="docs-footer page-meta">
        <div class="footer-container" role="presentation">
          <!-- <FollowUs />
          <Grade /> -->
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
const backTop = ref(frontmatter.value.backTop ?? true)
const anchorRight = ref(frontmatter.value.anchorRight ?? true)
</script>

<style lang="scss" scoped>
.footer-container {
  .docs-info {
    display: grid;
    place-items: center;
    padding-top: 20px;
    text-align: center;
  }
}
</style>
