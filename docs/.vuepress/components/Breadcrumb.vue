import { defineComponent } from 'vue';
<template>
  <el-breadcrumb separator-class="el-icon-arrow-right">
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script lang="ts">
import { ref, defineComponent, onMounted } from 'vue'
import {
  useSiteData,
  usePageData,
  useRouteLocale,
  useSiteLocaleData,
} from '@vuepress/client'
import type { PageData, RouteLocale, SiteLocaleData } from '@vuepress/client'

export default defineComponent({
  name: 'Breadcrumb',
  setup() {
    const router = useRouteLocale()
    const pageData = usePageData()
    const siteLocaleData = useSiteLocaleData()
    const siteData = useSiteData()
    onMounted(() => {
      console.log(router.value)
      console.log(pageData.value)
      console.log(siteLocaleData.value)
      console.log(siteData.value)
    })
  },
})
</script>

<style></style>
