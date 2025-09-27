<script setup lang="ts">
import { TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Props {
  availableLocales: string[]
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
}

interface Emits {
  (e: 'sort', column: string): void
}

const props = defineProps<Props>()
const _emit = defineEmits<Emits>()

function getLocaleDisplayName(locale: string): string {
  const localeNames: Record<string, string> = {
    zh: '中文',
    en: 'English',
    ja: '日本語',
  }
  return localeNames[locale] || locale
}

function getSortIcon(column: string): string {
  if (props.sortColumn !== column) {
    return 'i-lucide-arrow-up-down'
  }

  if (props.sortDirection === 'asc') {
    return 'i-lucide-arrow-up'
  }
  else if (props.sortDirection === 'desc') {
    return 'i-lucide-arrow-down'
  }

  return 'i-lucide-arrow-up-down'
}
</script>

<template>
  <TableHeader>
    <TableRow>
      <!-- 状态列 -->
      <TableHead
        class="w-[80px] cursor-pointer select-none transition-colors duration-200 hover:bg-muted/50"
        @click="$emit('sort', 'status')"
      >
        <div class="flex items-center gap-1">
          状态
          <i :class="getSortIcon('status')" class="h-3 w-3 transition-transform duration-200" />
        </div>
      </TableHead>

      <!-- 分类列 -->
      <TableHead
        class="w-[120px] cursor-pointer select-none hover:bg-muted/50"
        @click="$emit('sort', 'category')"
      >
        <div class="flex items-center gap-1">
          分类
          <i :class="getSortIcon('category')" class="h-3 w-3" />
        </div>
      </TableHead>

      <!-- 键名列 -->
      <TableHead
        class="w-[200px] cursor-pointer select-none hover:bg-muted/50"
        @click="$emit('sort', 'key')"
      >
        <div class="flex items-center gap-1">
          翻译键
          <i :class="getSortIcon('key')" class="h-3 w-3" />
        </div>
      </TableHead>

      <!-- 语言列 -->
      <TableHead
        v-for="locale in availableLocales"
        :key="locale"
        class="min-w-[180px] cursor-pointer select-none hover:bg-muted/50"
        @click="$emit('sort', locale)"
      >
        <div class="flex items-center gap-1">
          {{ getLocaleDisplayName(locale) }}
          <i :class="getSortIcon(locale)" class="h-3 w-3" />
        </div>
      </TableHead>

      <!-- 操作列 -->
      <TableHead class="w-[120px]">
        操作
      </TableHead>
    </TableRow>
  </TableHeader>
</template>
