<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { localesConfig } from '../../../.vitepress/config/locales'

interface Props {
  availableLocales: string[]
  categories: string[]
}

interface Emits {
  (e: 'export', payload: { locale: string, category: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedLocale = ref('')
const selectedCategory = ref('all')

function getLocaleDisplayName(locale: string): string {
  const configKey = locale === 'zh' ? 'root' : locale
  return localesConfig[configKey]?.label || locale
}

function handleExport() {
  if (!selectedLocale.value)
    return

  emit('export', {
    locale: selectedLocale.value,
    category: selectedCategory.value,
  })
}

// 设置默认语言
watch(() => props.availableLocales, (locales) => {
  if (!selectedLocale.value && locales.length > 0) {
    selectedLocale.value = locales[0]
  }
}, { immediate: true })
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>导出翻译文件</CardTitle>
      <CardDescription>将翻译内容导出为 TypeScript 文件</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap items-end gap-4">
        <div class="space-y-2">
          <Label for="export-locale" class="text-sm font-medium">语言</Label>
          <Select v-model="selectedLocale">
            <SelectTrigger id="export-locale" class="w-32 border border-border border-solid">
              <SelectValue placeholder="选择语言" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="locale in availableLocales"
                :key="locale"
                :value="locale"
              >
                {{ getLocaleDisplayName(locale) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label for="export-category" class="text-sm font-medium">分类</Label>
          <Select v-model="selectedCategory">
            <SelectTrigger id="export-category" class="w-40 border border-border border-solid">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                全部分类
              </SelectItem>
              <SelectItem
                v-for="category in categories.filter(c => c !== 'all')"
                :key="category"
                :value="category"
              >
                {{ category }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          :disabled="!selectedLocale"
          @click="handleExport"
        >
          <i class="i-lucide-download mr-2 h-4 w-4" />
          导出文件
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
