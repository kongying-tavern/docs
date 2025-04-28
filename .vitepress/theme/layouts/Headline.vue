<script setup lang="ts">
import { useData } from 'vitepress'

const { frontmatter } = useData()
</script>

<template>
  <div class="slide-enter Headline">
    <div class="border-b pb-6">
      <h1
        class="title text-3xl font-bold tracking-tight lg:text-5xl sm:text-4xl"
      >
        {{ frontmatter.title }}
      </h1>
      <p class="lead mt-4 text-lg">
        {{ frontmatter.subtext }}
      </p>
      <p v-if="frontmatter.action" class="action">
        <VPLink :href="frontmatter.action.link">
          {{ frontmatter.action.text }}
        </VPLink>
      </p>
    </div>
    <Content class="Headline" />
  </div>
</template>

<style scoped>
.Headline {
  margin-bottom: 96px;
  max-width: 1152px;
  margin: auto;
}

@media (min-width: 768px) {
  .Headline {
    margin-bottom: 128px;
    padding: 64px 32px 48px;
  }
}

.Headline {
  padding: 48px 24px;
}

.title,
.lead {
  transition: color 0.25s;
}

.lead {
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.action {
  padding-top: 4px;
}

.action :deep(a) {
  display: inline-block;
  line-height: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-brand);
  transition: color 0.25s;
}

.action :deep(a:hover) {
  color: var(--vp-c-brand-dark);
}
</style>
