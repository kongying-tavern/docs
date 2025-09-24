<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { computed, reactive, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { jsonTranslationService } from '~/services/jsonTranslationService'
import { localesConfig } from '../../../.vitepress/config/locales'

interface Props {
  open: boolean
  entry: TranslationEntry | null
  availableLocales: string[]
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'auto-save', entry: TranslationEntry): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 编辑表单
const editForm = reactive<TranslationEntry>({
  key: '',
  path: '',
  category: '',
  translations: {},
})

// 计算属性
const hasChanges = computed(() => {
  if (!props.entry)
    return false

  return props.availableLocales.some((locale) => {
    return editForm.translations[locale] !== props.entry!.translations[locale]
  })
})

// 方法
function getLocaleDisplayName(locale: string): string {
  const configKey = locale === 'zh' ? 'root' : locale
  return localesConfig[configKey]?.label || locale
}

function resetForm() {
  if (props.entry) {
    Object.assign(editForm, {
      key: props.entry.key,
      path: props.entry.path,
      category: props.entry.category,
      translations: { ...props.entry.translations },
    })
  }
}

function handleTranslationChange(locale: string, value: string) {
  if (!props.entry)
    return

  // 更新表单
  editForm.translations[locale] = value

  // 实时保存到翻译服务
  jsonTranslationService.updateTranslation(editForm.path, locale, value)

  // 通知父组件更新状态
  const updatedEntry: TranslationEntry = {
    key: editForm.key,
    path: editForm.path,
    category: editForm.category,
    translations: { ...editForm.translations },
    isModified: true,
    originalTranslations: props.entry.originalTranslations,
  }

  emit('auto-save', updatedEntry)
}

// 监听 entry 变化，重置表单
watch(
  () => props.entry,
  (newEntry) => {
    if (newEntry) {
      resetForm()
    }
  },
  { immediate: true },
)
</script>

<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-h-[80vh] max-w-4xl flex flex-col overflow-hidden">
      <DialogTitle class="flex items-center gap-2">
        <i class="i-lucide-edit h-5 w-5" />
        编辑翻译
      </DialogTitle>
      <DialogDescription>
        修改 {{ entry?.category }}.{{ entry?.key }} 的翻译内容
      </DialogDescription>

      <div v-if="entry" class="flex-1 overflow-auto space-y-4">
        <!-- 翻译键信息 -->
        <div class="border rounded-lg p-4">
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="font-medium">分类:</span>
              <span class="ml-2 rounded bg-muted px-2 py-1 text-xs font-medium">
                {{ entry.category }}
              </span>
            </div>
            <div>
              <span class="font-medium">翻译键:</span>
              <span class="ml-2 text-sm font-mono">
                {{ entry.key }}
              </span>
            </div>
          </div>
        </div>

        <!-- 翻译表单 -->
        <div class="space-y-4">
          <div
            v-for="locale in availableLocales"
            :key="locale"
            class="space-y-2"
          >
            <Label :for="`translation-${locale}`" class="text-sm font-medium">
              {{ getLocaleDisplayName(locale) }}
            </Label>
            <Textarea
              :id="`translation-${locale}`"
              v-model="editForm.translations[locale]"
              :placeholder="`输入 ${getLocaleDisplayName(locale)} 翻译...`"
              rows="3"
              class="w-full border border-border border-solid"
              @input="handleTranslationChange(locale, ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>

        <!-- 预览对比 -->
        <div class="border-t pt-4">
          <h4 class="mb-3 text-sm font-medium">
            变更预览
          </h4>
          <div class="space-y-3">
            <div
              v-for="locale in availableLocales"
              :key="locale"
              class="grid grid-cols-2 gap-4 text-sm"
            >
              <div>
                <div class="mb-1 text-xs text-muted-foreground">
                  {{ getLocaleDisplayName(locale) }} (原文)
                </div>
                <div class="min-h-[48px] border rounded p-3 text-sm">
                  {{ entry.translations[locale] || '(空)' }}
                </div>
              </div>
              <div>
                <div class="mb-1 text-xs text-muted-foreground">
                  {{ getLocaleDisplayName(locale) }} (新文)
                </div>
                <div class="min-h-[48px] border rounded p-3 text-sm">
                  {{ editForm.translations[locale] || '(空)' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex justify-end border-t pt-4 space-x-2">
        <Button
          variant="outline"
          @click="resetForm"
        >
          重置
        </Button>
        <Button
          @click="$emit('update:open', false)"
        >
          关闭
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
