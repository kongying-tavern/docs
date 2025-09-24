<script setup lang="ts">
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TranslationStats {
  total: number
  deleted: number
  filtered: number
  currentCategory: string
  totalCategories: number
  supportedLocales: string[]
}

interface Props {
  stats: TranslationStats
  searchQuery: string
  selectedCategory: string
  categories: string[]
}

interface Emits {
  (e: 'update:search', value: string): void
  (e: 'update:category', value: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div class="space-y-6">
    <!-- 统计信息卡片 -->
    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">
            筛选结果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats.filtered }}
          </div>
          <p class="text-xs text-muted-foreground">
            共 {{ stats.total }} 条记录
            ({{ stats.deleted }} 已删除)
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">
            当前分类
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats.currentCategory === 'all' ? '全部' : stats.currentCategory }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ stats.currentCategory === 'all' ? `${stats.totalCategories} 个分类` : '单个分类' }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle class="text-sm font-medium">
            支持语言
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{ stats.supportedLocales.length }}
          </div>
          <p class="text-xs text-muted-foreground">
            {{ stats.supportedLocales.join(', ') }}
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- 搜索和过滤栏 -->
    <div class="flex flex-col gap-4 sm:flex-row">
      <div class="flex-1">
        <div class="relative">
          <i class="i-lucide-search absolute left-3 top-1/2 h-4 w-4 transform text-muted-foreground -translate-y-1/2" />
          <Input
            :model-value="searchQuery"
            placeholder="搜索翻译键或内容..."
            class="border border-border border-solid pl-10"
            @update:model-value="$emit('update:search', $event)"
          />
        </div>
      </div>
      <div class="w-full sm:w-48">
        <Select
          :model-value="selectedCategory"
          @update:model-value="$emit('update:category', $event)"
        >
          <SelectTrigger class="border border-border border-solid">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="cat in categories"
              :key="cat"
              :value="cat"
            >
              {{ cat === 'all' ? '全部分类' : cat }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  </div>
</template>
