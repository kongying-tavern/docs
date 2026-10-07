<script setup lang="ts">
import { useData, withBase } from 'vitepress'
import { computed } from 'vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const { frontmatter, theme } = useData()

const breadcrumbs = computed(
  () =>
    (frontmatter.value.breadcrumbs ?? []) as {
      title: string
      link: string
    }[],
)
</script>

<template>
  <Breadcrumb v-if="breadcrumbs.length > 1">
    <BreadcrumbList>
      <template
        v-for="(breadcrumb, index) in breadcrumbs"
        :key="index"
      >
        <BreadcrumbItem class="slide-enter" :style="{ '--enter-stage': index }">
          <BreadcrumbLink
            v-if="breadcrumb.link && index !== breadcrumbs.length - 1"
            class="font-[var(--vp-font-family-subtitle)] capitalize"
            :href="withBase(breadcrumb.link)"
          >
            {{ index === 0 ? theme.siteTitle : breadcrumb.title }}
          </BreadcrumbLink>
          <BreadcrumbPage
            v-else-if="index === breadcrumbs.length - 1"
            class="font-[var(--vp-font-family-subtitle)] capitalize"
          >
            {{ index === 0 ? theme.siteTitle : breadcrumb.title }}
          </BreadcrumbPage>
          <span v-else class="font-[var(--vp-font-family-subtitle)] capitalize">
            {{ index === 0 ? theme.siteTitle : breadcrumb.title }}
          </span>
        </BreadcrumbItem>
        <!-- 分隔符随其后的一节入场，保证整条面包屑自左向右逐项出现 -->
        <BreadcrumbSeparator
          v-if="index !== breadcrumbs.length - 1"
          class="slide-enter"
          :style="{ '--enter-stage': index + 1 }"
        />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
