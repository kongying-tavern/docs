<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useData, useRouter } from 'vitepress'
import { computed } from 'vue'

const { frontmatter, theme } = useData()
const { go } = useRouter()

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
        :key="breadcrumb.title"
      >
        <BreadcrumbItem>
          <BreadcrumbLink
            class="font-[var(--vp-font-family-subtitle)] capitalize"
            href="#"
            :class="{ 'text-foreground': index === breadcrumbs.length - 1 }"
            @click="go(breadcrumb.link)"
          >
            {{ index === 0 ? theme.siteTitle : breadcrumb.title }}
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if="index !== breadcrumbs.length - 1" />
      </template>
    </BreadcrumbList>
  </Breadcrumb>
</template>
