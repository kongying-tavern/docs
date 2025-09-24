<script setup lang="ts">
import type { EnhancedBlogPost } from './composables/useBlogData'
import type { BlogDraft } from '~/services/blogDraftDB'
import { useData, withBase } from 'vitepress'
import { computed, watch } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Time } from '@/components/ui/Time'
import UserAvatar from '@/components/UserAvatar.vue'
import { getLangPath } from '@/utils'
import { useBlogDraftStore } from '~/stores/useBlogDraftStore'
import { useBlogSelectionData } from './composables/useBlogComposers'

interface Props {
  open: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'select', data: { type: 'draft' | 'api' | 'new', id?: string | number }): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const { lang, localeIndex } = useData()

// 使用 Pinia 草稿状态管理和数据组合器
const draftStore = useBlogDraftStore()

const {
  publishedPosts,
  apiPosts,
  needsUpdatePosts,
  isLoading,
  canManageBlog,
  refresh,
} = useBlogSelectionData(lang.value)

// 直接使用 Pinia store 的草稿数据
const localDrafts = computed(() => draftStore.drafts)

// 获取当前用户信息（用于草稿显示）
const currentUser = computed(() => {
  if (!canManageBlog.value)
    return null

  return {
    name: '当前用户',
    avatar: 'https://assets.yuanshen.site/res_ext/avatar/UI_AvatarIcon_71045_Circle.png',
  }
})

// 简化的数据加载 - 包含 Pinia store
async function loadData() {
  try {
    await Promise.all([
      refresh(),
      draftStore.fetchDrafts(),
    ])
  }
  catch (error) {
    console.error('加载数据失败:', error)
  }
}

// 选择操作
function selectDraft(draft: BlogDraft) {
  emits('select', { type: 'draft', id: draft.id })
  emits('update:open', false)
}

function selectPublishedPost(post: EnhancedBlogPost) {
  emits('select', { type: 'api', id: post.id })
  emits('update:open', false)
}

function createNew() {
  emits('select', { type: 'new' })
  emits('update:open', false)
}

// 生成编辑链接
function generateEditUrl(type: 'draft' | 'api', id: string | number) {
  const basePath = `${getLangPath(localeIndex.value)}blog/editor`
  if (type === 'draft') {
    return withBase(`${basePath}?draft=${id}`)
  }
  else {
    return withBase(`${basePath}?edit=${id}`)
  }
}

// 监听对话框打开状态，在打开时加载数据
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loadData()
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog :open="open" @update:open="emits('update:open', $event)">
    <DialogContent class="grid-rows-[auto_minmax(0,1fr)] max-h-[90dvh] max-w-4xl p-0">
      <DialogHeader class="p-6 pb-0">
        <DialogTitle class="text-xl font-bold">
          选择要编辑的博客
        </DialogTitle>
        <DialogDescription>
          您可以选择编辑现有的草稿或已发布的博客，或者创建一个全新的博客。
        </DialogDescription>
      </DialogHeader>

      <div class="overflow-y-auto px-6 custom-scrollbar">
        <Tabs default-value="drafts" class="w-full">
          <TabsList class="grid grid-cols-4 w-full">
            <TabsTrigger value="drafts" class="flex items-center gap-2 text-sm">
              <span class="i-lucide:file-edit h-4 w-4" />
              本地草稿 ({{ localDrafts.length }})
            </TabsTrigger>
            <TabsTrigger value="api-posts" class="flex items-center gap-2 text-sm">
              <span class="i-lucide:cloud h-4 w-4" />
              云端博客 ({{ apiPosts.length }})
            </TabsTrigger>
            <TabsTrigger value="published" class="flex items-center gap-2 text-sm">
              <span class="i-lucide:file-check h-4 w-4" />
              已发布 ({{ publishedPosts.length }})
            </TabsTrigger>
            <TabsTrigger value="new" class="flex items-center gap-2 text-sm">
              <span class="i-lucide:plus h-4 w-4" />
              新建
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" class="mt-4">
            <div class="pr-2 space-y-3">
              <div v-if="isLoading" class="flex items-center justify-center py-8">
                <div class="h-8 w-8 animate-spin border-b-2 border-primary rounded-full" />
              </div>

              <div v-else-if="localDrafts.length === 0" class="py-8 text-center text-muted-foreground">
                <div class="i-lucide:file-x mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>暂无草稿</p>
                <p class="text-sm">
                  点击"新建博客"开始创作吧！
                </p>
              </div>

              <Card
                v-for="draft in localDrafts"
                v-else
                :key="draft.id"
                class="cursor-pointer transition-shadow hover:shadow-md"
                @click="selectDraft(draft)"
              >
                <CardHeader class="pb-3">
                  <div class="flex items-start justify-between">
                    <div class="min-w-0 flex-1">
                      <CardTitle class="truncate text-base">
                        {{ draft.title || '无标题草稿' }}
                      </CardTitle>
                      <div class="mt-2 space-y-1">
                        <div v-if="currentUser" class="flex items-center gap-2">
                          <UserAvatar
                            :src="currentUser.avatar"
                            :alt="currentUser.name"
                            size="xs"
                          />
                          <span class="text-xs text-muted-foreground">{{ currentUser.name }}</span>
                        </div>
                        <CardDescription class="text-xs">
                          更新于 <Time :datetime="draft.updatedAt" relative />
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" class="ml-2 shrink-0">
                      <span class="i-lucide:edit mr-1 h-3 w-3" />
                      草稿
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent v-if="draft.content" class="pt-0">
                  <p class="line-clamp-2 text-sm text-muted-foreground">
                    {{ draft.content.replace(/<[^>]*>/g, '').substring(0, 100) }}...
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="api-posts" class="mt-4">
            <div class="pr-2 space-y-3">
              <div v-if="isLoading" class="flex items-center justify-center py-8">
                <div class="h-8 w-8 animate-spin border-b-2 border-primary rounded-full" />
              </div>

              <div v-else-if="apiPosts.length === 0" class="py-8 text-center text-muted-foreground">
                <div class="i-lucide:cloud-off mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>暂无云端博客</p>
                <p class="text-sm">
                  在线编辑的博客会显示在这里
                </p>
              </div>

              <Card
                v-for="post in apiPosts"
                v-else
                :key="post.id"
                class="cursor-pointer transition-shadow hover:shadow-md"
                @click="selectPublishedPost(post)"
              >
                <CardHeader class="pb-3">
                  <div class="flex items-start justify-between">
                    <div class="min-w-0 flex-1">
                      <CardTitle class="truncate text-base">
                        {{ post.title }}
                      </CardTitle>
                      <div class="mt-2 space-y-1">
                        <div v-if="post.author" class="flex items-center gap-2">
                          <UserAvatar
                            :src="post.author.avatar"
                            :alt="post.author.username || post.author.login"
                            size="xs"
                          />
                          <span class="text-xs text-muted-foreground">{{ post.author.username || post.author.login }}</span>
                        </div>
                        <CardDescription class="text-xs">
                          更新于 <Time :datetime="post.updatedAt" relative />
                        </CardDescription>
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <!-- 动态显示标签：草稿或待发布 -->
                      <Badge
                        v-if="post.tags?.some(tag => tag.toLowerCase().includes('draft'))"
                        variant="secondary"
                        class="border-blue-200 bg-blue-50 text-blue-600"
                      >
                        <span class="i-lucide:edit mr-1 h-3 w-3" />
                        草稿
                      </Badge>
                      <Badge
                        v-else
                        variant="outline"
                        class="border-orange-200 bg-orange-50 text-orange-600"
                      >
                        <span class="i-lucide:clock mr-1 h-3 w-3" />
                        待发布
                      </Badge>
                      <span class="text-xs text-muted-foreground">ID: {{ post.id }}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent v-if="post.contentRaw" class="pt-0">
                  <p class="line-clamp-2 text-sm text-muted-foreground">
                    {{ post.contentRaw.replace(/<[^>]*>/g, '').substring(0, 100) }}...
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="published" class="mt-4">
            <div class="pr-2 space-y-3">
              <div v-if="isLoading" class="flex items-center justify-center py-8">
                <div class="h-8 w-8 animate-spin border-b-2 border-primary rounded-full" />
              </div>

              <div v-else-if="publishedPosts.length === 0" class="py-8 text-center text-muted-foreground">
                <div class="i-lucide:file-x mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>暂无已发布的博客</p>
                <p class="text-sm">
                  发布一些内容后就会显示在这里
                </p>
              </div>

              <Card
                v-for="post in publishedPosts"
                v-else
                :key="post.id"
                class="cursor-pointer transition-shadow hover:shadow-md"
                @click="selectPublishedPost(post)"
              >
                <CardHeader class="pb-3">
                  <div class="flex items-start justify-between">
                    <div class="min-w-0 flex-1">
                      <CardTitle class="truncate text-base">
                        {{ post.title }}
                      </CardTitle>
                      <div class="mt-2 space-y-1">
                        <div v-if="post.author" class="flex items-center gap-2">
                          <UserAvatar
                            :src="post.author.avatar"
                            :alt="post.author.username || post.author.login"
                            size="xs"
                          />
                          <span class="text-xs text-muted-foreground">{{ post.author.username || post.author.login }}</span>
                        </div>
                        <CardDescription class="text-xs">
                          发布于 <Time :datetime="post.createdAt" relative />
                          <span v-if="post.updatedAt !== post.createdAt">
                            · 更新于 <Time :datetime="post.updatedAt" relative />
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div class="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" class="border-green-200 bg-green-50 text-green-600">
                        <span class="i-lucide:check-circle mr-1 h-3 w-3" />
                        已发布
                      </Badge>
                      <span class="text-xs text-muted-foreground">ID: {{ post.id }}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent v-if="post.contentRaw" class="pt-0">
                  <p class="line-clamp-2 text-sm text-muted-foreground">
                    {{ post.contentRaw.replace(/<[^>]*>/g, '').substring(0, 100) }}...
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="new" class="mt-4">
            <div class="flex flex-col items-center justify-center py-8 text-center space-y-6">
              <div class="h-24 w-24 flex items-center justify-center rounded-full bg-primary/10">
                <span class="i-lucide:file-plus h-12 w-12 text-primary" />
              </div>

              <div class="space-y-2">
                <h3 class="text-lg font-semibold">
                  创建新博客
                </h3>
                <p class="max-w-md text-muted-foreground">
                  开始一篇全新的博客创作。你可以使用富文本编辑器来撰写和格式化你的内容。
                </p>
              </div>

              <Button size="lg" class="min-w-[120px]" @click="createNew">
                <span class="i-lucide:plus mr-2 h-4 w-4" />
                开始创作
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}
</style>
