<template>
  <Layout>
    <template #navbar-after>
      <nav class="navbar-icons" style="margin-right: -0.5rem">
        <i v-for="val in IconList">
          <a
            :href="val.link"
            :target="val.target"
            rel="noopener noreferrer"
            :title="val.title"
          >
            <SvgIcon
              style="
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
              "
              :name="val.iconName"
            />
          </a>
        </i>
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
import { ref } from 'vue'

const IconList = ref([
  {
    link: 'https://github.com/kongying-tavern',
    target: '_blank',
    title: 'Github',
    iconName: 'github',
  },
  {
    link: 'https://discord.gg/aFe57AKZUF',
    title: 'Discord',
    target: '_blank',
    iconName: 'discord',
  },
])
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
</style>
