<script setup lang="ts">
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  search: string
  category: string
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
  <div class="flex flex-col gap-4 sm:flex-row">
    <div class="flex-1">
      <div class="relative">
        <i class="i-lucide-search absolute left-3 top-1/2 h-4 w-4 transform text-muted-foreground -translate-y-1/2" />
        <Input
          :model-value="search"
          placeholder="搜索翻译键或内容..."
          class="border border-border border-solid pl-10"
          @update:model-value="$emit('update:search', $event)"
        />
      </div>
    </div>
    <div class="w-full sm:w-48">
      <Select
        :model-value="category"
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
</template>
