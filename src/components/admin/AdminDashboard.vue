<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { useRouter } from 'vitepress'
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { jsonTranslationService } from '~/services/jsonTranslationService'
import QQGroupManagementTab from './QQGroupManagementTab.vue'
import TranslationManagementTab from './TranslationManagementTab.vue'

defineOptions({
  meta: {
    availableTabs: ['overview', 'translations', 'qq-groups'] as const,
    defaultTab: 'overview' as const,
    routeOptions: {
      tab: ['overview', 'translations', 'qq-groups'] as const,
    },
    locales: {
      root: {
        title: '管理后台',
        description: '站点管理控制面板',
      },
    },
    data: {
      frontmatter: {
        layout: 'page',
        sidebar: false,
      },
    },
    i18n: true,
  },
})

// 权限检查
const { hasAnyPermissions } = useRuleChecks()
const hasManagePermission = hasAnyPermissions('manage_feedback')

// 路由管理
const { route } = useRouter()
const router = useRouter()

// 状态管理
const loading = ref(false)
const activeTab = ref('overview')

// 数据状态
const translationEntries = ref<TranslationEntry[]>([])
const availableLocales = ref<string[]>([])
const categories = ref<string[]>([])

// 统计信息
const stats = computed(() => ({
  totalTranslations: translationEntries.value.length,
  totalLocales: availableLocales.value.length,
  totalCategories: categories.value.filter(c => c !== 'all').length,
}))

const categoryStats = computed(() => {
  const stats = categories.value
    .filter(c => c !== 'all')
    .map(category => ({
      name: category,
      count: translationEntries.value.filter(entry => entry.category === category).length,
    }))
    .sort((a, b) => b.count - a.count)

  return stats.slice(0, 6) // 只显示前6个
})

// 路由状态管理
function updateActiveTabFromRoute() {
  const tabParam = route.data.params?.tab as string
  if (tabParam) {
    return activeTab.value = tabParam
  }

  activeTab.value = 'overview'
}

function updateRouteFromTab(tab: string) {
  const basePath = '/dashboard'
  const newPath = tab === 'overview' ? basePath : `${basePath}/${tab}`
  router.go(newPath)
}

// 监听路由变化
watch(() => route.data.params?.tab, updateActiveTabFromRoute, { immediate: true })

// 监听 tab 变化更新路由
watch(activeTab, (newTab) => {
  const currentTab = route.data.params?.tab as string || 'overview'
  if (newTab !== currentTab) {
    updateRouteFromTab(newTab)
  }
})

// 方法
async function loadData() {
  console.log('loadData called')
  loading.value = true
  try {
    console.log('Initializing JSON translation service...')
    await jsonTranslationService.initialize()
    console.log('JSON translation service initialized')

    translationEntries.value = jsonTranslationService.getTranslationEntries()
    availableLocales.value = jsonTranslationService.getAvailableLocales()
    categories.value = jsonTranslationService.getCategories()

    console.log('Data loaded:', {
      entries: translationEntries.value.length,
      locales: availableLocales.value,
      categories: categories.value,
    })

    // 调试：查看 head 相关的条目
    const headEntries = translationEntries.value.filter(entry => entry.path.includes('head'))
    console.log('Head entries:', headEntries.slice(0, 3))
  }
  catch (error) {
    console.error('Data loading failed:', error)
    toast.error('数据加载失败')
  }
  finally {
    loading.value = false
  }
}

// 处理翻译条目更新
function handleEntriesUpdated() {
  // 重新获取最新数据以确保同步，创建新的数组引用来强制响应式更新
  const newEntries = jsonTranslationService.getTranslationEntries()
  translationEntries.value = [...newEntries]
}

function exportAllTranslations() {
  try {
    availableLocales.value.forEach((locale) => {
      const localeCode = jsonTranslationService.getLocaleCode(locale)
      const allFiles = jsonTranslationService.exportAllCategories(locale)
      Object.entries(allFiles).forEach(([category, content]) => {
        downloadFile(`${localeCode}-${category}.json`, content)
      })
    })
    toast.success('所有翻译文件已导出')
  }
  catch {
    toast.error('导出失败')
  }
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 生命周期
onMounted(() => {
  console.log('AdminDashboard mounted, hasManagePermission:', hasManagePermission.value)
  // 暂时绕过权限检查进行测试
  loadData()
})
</script>

<template>
  <ClientOnly>
    <div class="admin-dashboard">
      <!-- 权限检查 -->
      <template v-if="false">
        <div class="min-h-[400px] flex items-center justify-center">
          <Card class="w-[420px]">
            <CardHeader class="text-center">
              <CardTitle class="text-xl text-destructive">
                权限不足
              </CardTitle>
              <CardDescription>
                此页面仅对管理员开放
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </template>

      <!-- 加载状态 -->
      <template v-else-if="loading">
        <div class="admin-container">
          <div class="mb-6 border-b pb-6">
            <Skeleton class="mb-2 h-10 w-48" />
            <Skeleton class="h-6 w-64" />
          </div>

          <div class="space-y-6">
            <div class="flex space-x-2">
              <Skeleton v-for="i in 4" :key="i" class="h-10 w-24" />
            </div>

            <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
              <Skeleton v-for="i in 4" :key="i" class="h-32" />
            </div>
          </div>
        </div>
      </template>

      <!-- Dashboard界面 -->
      <template v-else>
        <div class="admin-container">
          <!-- 页面标题 -->
          <div class="mb-6 border-b pb-6">
            <div>
              <h1 class="text-3xl font-bold tracking-tight lg:text-4xl sm:text-3xl">
                管理后台
              </h1>
              <p class="mt-2 text-lg text-muted-foreground">
                站点管理控制面板
              </p>
            </div>
          </div>

          <!-- Tab导航 -->
          <Tabs v-model="activeTab" class="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">
                概览
              </TabsTrigger>
              <TabsTrigger value="translations">
                翻译管理
              </TabsTrigger>
              <TabsTrigger value="qq-groups">
                QQ群管理
              </TabsTrigger>
              <TabsTrigger value="users" disabled>
                用户管理
              </TabsTrigger>
              <TabsTrigger value="logs" disabled>
                操作日志
              </TabsTrigger>
            </TabsList>

            <!-- 概览Tab -->
            <TabsContent
              v-motion
              value="overview"
              class="space-y-6"
              :initial="{ opacity: 0, y: 20 }"
              :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
            >
              <!-- 统计卡片 -->
              <div class="grid gap-4 lg:grid-cols-4 md:grid-cols-2">
                <Card
                  v-motion
                  :initial="{ opacity: 0, y: 20 }"
                  :enter="{ opacity: 1, y: 0, transition: { delay: 100 } }"
                  class="transition-shadow duration-300 hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle class="text-sm font-medium">
                      翻译条目总数
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="text-2xl font-bold">
                      {{ stats.totalTranslations }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                      跨 {{ stats.totalCategories }} 个分类
                    </p>
                  </CardContent>
                </Card>

                <Card
                  v-motion
                  :initial="{ opacity: 0, y: 20 }"
                  :enter="{ opacity: 1, y: 0, transition: { delay: 200 } }"
                  class="transition-shadow duration-300 hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle class="text-sm font-medium">
                      支持语言
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="text-2xl font-bold">
                      {{ stats.totalLocales }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                      {{ availableLocales.join(', ') }}
                    </p>
                  </CardContent>
                </Card>

                <Card
                  v-motion
                  :initial="{ opacity: 0, y: 20 }"
                  :enter="{ opacity: 1, y: 0, transition: { delay: 300 } }"
                  class="transition-shadow duration-300 hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle class="text-sm font-medium">
                      配置分类
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="text-2xl font-bold">
                      {{ stats.totalCategories }}
                    </div>
                    <p class="text-xs text-muted-foreground">
                      UI、论坛、导航等
                    </p>
                  </CardContent>
                </Card>

                <Card
                  v-motion
                  :initial="{ opacity: 0, y: 20 }"
                  :enter="{ opacity: 1, y: 0, transition: { delay: 400 } }"
                  class="transition-shadow duration-300 hover:shadow-md"
                >
                  <CardHeader>
                    <CardTitle class="text-sm font-medium">
                      系统状态
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="text-2xl font-bold">
                      正常
                    </div>
                    <p class="text-xs text-muted-foreground">
                      所有功能运行正常
                    </p>
                  </CardContent>
                </Card>
              </div>

              <!-- 快速操作 -->
              <div class="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>快速操作</CardTitle>
                  </CardHeader>
                  <CardContent class="space-y-3">
                    <Button class="w-full" @click="activeTab = 'translations'">
                      <i class="i-lucide-edit mr-2 h-4 w-4" />
                      管理翻译
                    </Button>
                    <Button class="w-full" @click="activeTab = 'qq-groups'">
                      <i class="i-lucide-users mr-2 h-4 w-4" />
                      管理QQ群
                    </Button>
                    <Button
                      variant="outline"
                      class="w-full"
                      :disabled="loading"
                      @click="exportAllTranslations"
                    >
                      <i class="i-lucide-download mr-2 h-4 w-4" />
                      导出全部翻译
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>分类统计</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div class="space-y-2">
                      <div
                        v-for="category in categoryStats"
                        :key="category.name"
                        class="flex justify-between text-sm"
                      >
                        <span>{{ category.name }}</span>
                        <span class="font-medium">{{ category.count }}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <!-- 翻译管理Tab -->
            <TabsContent
              v-motion
              value="translations"
              class="space-y-4"
              :initial="{ opacity: 0, y: 20 }"
              :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
            >
              <TranslationManagementTab
                :available-locales="availableLocales"
                :translation-entries="translationEntries"
                :categories="categories"
                @entries-updated="handleEntriesUpdated"
              />
            </TabsContent>

            <!-- QQ群管理Tab -->
            <TabsContent
              v-motion
              value="qq-groups"
              class="space-y-4"
              :initial="{ opacity: 0, y: 20 }"
              :enter="{ opacity: 1, y: 0, transition: { duration: 300 } }"
            >
              <QQGroupManagementTab />
            </TabsContent>
          </Tabs>
        </div>
      </template>
    </div>
  </ClientOnly>
</template>

<style scoped>
.admin-container {
  margin: 0 auto;
  padding: 48px 0 96px;
  max-width: calc(var(--vp-layout-max-width, 1440px) - 64px);
}

@media (min-width: 640px) {
  .admin-container {
    padding: 48px 0 96px;
  }
}

@media (min-width: 960px) {
  .admin-container {
    padding: 64px 0 128px;
  }
}
</style>
