<script setup lang="ts">
import { useData, useRoute } from 'vitepress'
import VPDocAside, { useSidebar } from 'vitepress/theme-without-fonts'
import { computed } from 'vue'
import { replaceTitle } from '@/composables/replaceTitle'
import ForumBlogPostHeader from '~/components/forum/blog/ForumBlogPostHeader.vue'
import '../styles/post-layout.css'

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
    class="post-layout"
    :class="{ 'has-sidebar': hasSidebar, 'has-aside': hasAside }"
  >
    <slot name="doc-top" />
    <div class="post-container">
      <div v-if="hasAside" class="post-aside" :class="{ 'left-aside': leftAside }">
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

      <div class="post-content">
        <div class="post-content-container">
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
/* Post layout styles now moved to shared CSS file */
</style>
