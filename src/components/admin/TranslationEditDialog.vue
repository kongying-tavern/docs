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
const _hasChanges = computed(() => {
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
    <DialogContent class="flex flex-col max-h-[80vh] max-w-4xl overflow-hidden">
      <DialogTitle class="flex gap-2 items-center">
        <i class="i-lucide-edit h-5 w-5" />
        编辑翻译
      </DialogTitle>
      <DialogDescription>
        修改 {{ entry?.category }}.{{ entry?.key }} 的翻译内容
      </DialogDescription>

      <div v-if="entry" class="flex-1 overflow-auto space-y-4">
        <!-- 翻译键信息 -->
        <div class="p-4 border rounded-lg">
          <div class="text-sm gap-4 grid grid-cols-2">
            <div>
              <span class="font-medium">分类:</span>
              <span class="text-xs font-medium ml-2 px-2 py-1 rounded bg-muted">
                {{ entry.category }}
              </span>
            </div>
            <div>
              <span class="font-medium">翻译键:</span>
              <span class="text-sm font-mono ml-2">
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
              class="border border-border border-solid w-full"
              @input="handleTranslationChange(locale, ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>

        <!-- 预览对比 -->
        <div class="pt-4 border-t">
          <h4 class="text-sm font-medium mb-3">
            变更预览
          </h4>
          <div class="space-y-3">
            <div
              v-for="locale in availableLocales"
              :key="locale"
              class="text-sm gap-4 grid grid-cols-2"
            >
              <div>
                <div class="text-xs text-muted-foreground mb-1">
                  {{ getLocaleDisplayName(locale) }} (原文)
                </div>
                <div class="text-sm p-3 border rounded min-h-[48px]">
                  {{ entry.translations[locale] || '(空)' }}
                </div>
              </div>
              <div>
                <div class="text-xs text-muted-foreground mb-1">
                  {{ getLocaleDisplayName(locale) }} (新文)
                </div>
                <div class="text-sm p-3 border rounded min-h-[48px]">
                  {{ editForm.translations[locale] || '(空)' }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="pt-4 border-t flex justify-end space-x-2">
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
