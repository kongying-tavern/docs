<template>
  <Layout>
    <template #page-bottom>
      <footer class="docs-footer page-meta">
        <div class="footer-container" role="presentation">
          <div class="docs-info">Chinese hoyolab Made By Kongying Tavern</div>
        </div>
      </footer>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'
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
