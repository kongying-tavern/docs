<template>
  <Layout>
    <template #navbar-after>
      <nav class="navbar-icons">
        <a
          href="https://github.com/kongying-tavern"
          target="_blank"
          rel="noopener noreferrer"
          title="Github"
        >
          <SvgIcon name="github" />
        </a>
        <a
          href="https://discord.gg/aFe57AKZUF"
          target="_blank"
          rel="noopener noreferrer"
          title="discord"
        >
          <SvgIcon name="discord" />
        </a>
      </nav>
    </template>
    <template #page-bottom>
      <footer class="docs-footer page-meta">
        <div class="footer-container" role="presentation">
          <div class="docs-info">MIT Licensed | Made by Kongying Tavern</div>
        </div>
      </footer>
    </template>
  </Layout>
</template>

<script setup lang="ts">
import Layout from '@vuepress/theme-default/lib/client/layouts/Layout.vue'
</script>

<style lang="scss">
.footer-container {
  border-top: 1px solid var(--c-border);
  .docs-info {
    display: grid;
    place-items: center;
    padding-top: 20px;
    text-align: center;
  }
}

.navbar-icons {
  margin-right: -0.5rem;
  a {
    margin-left: 1rem;
    width: 1.25rem;
    height: 1.25rem;
    display: inline-flex;
    align-items: center;
    vertical-align: text-top;
    gap: 0.75rem;
    font-size: 20px;
    filter: grayscale(100%);
    filter: black;
    transition: all 0.2s;
    &:hover {
      filter: grayscale(0);
    }
  }
}
</style>
