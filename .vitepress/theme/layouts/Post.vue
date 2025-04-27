<script setup lang="ts">
import { replaceTitle } from '@/composables/replaceTitle'
import { useData, useRoute } from 'vitepress'
import VPDocAside, { useSidebar } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import ForumBlogPostHeader from '~/components/forum/blog/ForumBlogPostHeader.vue'

const { params, theme } = useData()
const { hasSidebar, hasAside, leftAside } = useSidebar()
const route = useRoute()

const pageName = computed(() =>
  route.path.replace(/[./]+/g, '_').replace(/_html$/, ''),
)

if (params?.value?.title === 'Redirect Page' && !import.meta.env.SSR) {
  location.replace(`./${params?.value.id}`)
}

if (params?.value) {
  replaceTitle(params?.value.title)
}
</script>

<template>
  <div
    class="Post"
    :class="{ 'has-sidebar': hasSidebar, 'has-aside': hasAside }"
  >
    <slot name="doc-top" />
    <div class="container">
      <div v-if="hasAside" class="aside" :class="{ 'left-aside': leftAside }">
        <div class="aside-curtain" />
        <div class="aside-container">
          <div class="aside-content">
            <VPDocAside>
              <template #aside-top>
                <slot name="aside-top" />
              </template>
              <template #aside-bottom>
                <slot name="aside-bottom" />
              </template>
              <template #aside-outline-before>
                <slot name="aside-outline-before" />
              </template>
              <template #aside-outline-after>
                <slot name="aside-outline-after" />
              </template>
              <template #aside-ads-before>
                <slot name="aside-ads-before" />
              </template>
              <template #aside-ads-after>
                <slot name="aside-ads-after" />
              </template>
            </VPDocAside>
          </div>
        </div>
      </div>

      <div class="content">
        <div class="content-container">
          <slot name="doc-before" />

          <ForumBlogPostHeader
            :title="params?.title"
            :date="params?.updatedAt"
            :author="params?.author"
            :description="params?.description"
          />

          <main class="main">
            <Content
              class="vp-doc"
              :class="[
                pageName,
                theme.externalLinkIcon && 'external-link-icon-enabled',
              ]"
            />
          </main>
        </div>
      </div>
    </div>
    <slot name="doc-bottom" />
  </div>
</template>

<style scoped>
.Post {
  padding: 32px 24px 96px;
  width: 100%;
}

@media (min-width: 768px) {
  .Post {
    padding: 48px 32px 128px;
  }
}

@media (min-width: 960px) {
  .Post {
    padding: 48px 32px 0;
  }

  .Post:not(.has-sidebar) .container {
    display: flex;
    justify-content: center;
    max-width: 992px;
  }

  .Post:not(.has-sidebar) .content {
    max-width: 752px;
  }
}

@media (min-width: 1280px) {
  .Post .container {
    display: flex;
    justify-content: center;
  }

  .Post .aside {
    display: block;
  }
}

@media (min-width: 1440px) {
  .Post:not(.has-sidebar) .content {
    max-width: 992px;
  }

  .Post:not(.has-sidebar) .container {
    max-width: 1104px;
  }
}

.container {
  margin: 0 auto;
  width: 100%;
}

.aside {
  position: relative;
  display: none;
  order: 2;
  flex-grow: 1;
  padding-left: 32px;
  width: 100%;
  max-width: 256px;
}

.left-aside {
  order: 1;
  padding-left: unset;
  padding-right: 32px;
}

.aside-container {
  position: fixed;
  top: 0;
  padding-top: calc(
    var(--vp-nav-height) + var(--vp-layout-top-height, 0px) +
      var(--vp-doc-top-height, 0px) + 48px
  );
  width: 224px;
  height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

.aside-container::-webkit-scrollbar {
  display: none;
}

.aside-curtain {
  position: fixed;
  bottom: 0;
  z-index: 10;
  width: 224px;
  height: 32px;
  background: linear-gradient(transparent, var(--vp-c-bg) 70%);
  pointer-events: none;
}

.aside-content {
  display: flex;
  flex-direction: column;
  min-height: calc(
    100vh - (var(--vp-nav-height) + var(--vp-layout-top-height, 0px) + 48px)
  );
  padding-bottom: 32px;
}

.content {
  position: relative;
  margin: 0 auto;
  width: 100%;
}

@media (min-width: 960px) {
  .content {
    padding: 0 32px 128px;
  }
}

@media (min-width: 1280px) {
  .content {
    order: 1;
    margin: 0;
    min-width: 640px;
  }
}

.content-container {
  margin: 0 auto;
}

.Post.has-aside .content-container {
  max-width: 688px;
}
</style>
