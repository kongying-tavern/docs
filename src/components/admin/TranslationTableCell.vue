<script setup lang="ts">
import type { TranslationEntry } from '~/services/jsonTranslationService'
import { nextTick, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { jsonTranslationService } from '~/services/jsonTranslationService'
import { translationExportService } from '~/services/translationExportService'

interface Props {
  entry: TranslationEntry
  locale: string
}

interface Emits {
  (e: 'edit', entry: TranslationEntry): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 编辑状态
const isEditing = ref(false)
const editingValue = ref('')
const copyingField = ref(false)

// 开始编辑
async function startEditing() {
  isEditing.value = true
  editingValue.value = props.entry.translations[props.locale] || ''

  await nextTick()
  const input = document.querySelector('input[autofocus]') as HTMLInputElement | null
  if (input) {
    input.focus()
    input.select()
  }
}

// 保存编辑
function saveEdit() {
  if (!isEditing.value)
    return

  // 更新翻译
  props.entry.translations[props.locale] = editingValue.value

  // 自动保存到翻译服务
  jsonTranslationService.updateTranslation(props.entry.path, props.locale, editingValue.value)
  jsonTranslationService.markEntryAsModified(props.entry)

  // 通知父组件
  emit('edit', props.entry)

  cancelEditing()
}

// 取消编辑
function cancelEditing() {
  isEditing.value = false
  editingValue.value = ''
}

// 处理键盘事件
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    saveEdit()
  }
  else if (event.key === 'Escape') {
    cancelEditing()
  }
}

// 复制字段值
async function copyFieldValue() {
  const value = props.entry.translations[props.locale]
  if (!value)
    return

  copyingField.value = true

  try {
    const success = await translationExportService.copyToClipboard(value)
    if (success) {
      console.log('复制成功')
    }
    else {
      console.error('复制失败')
    }
  }
  catch (error) {
    console.error('复制出错:', error)
  }
  finally {
    setTimeout(() => {
      copyingField.value = false
    }, 1000)
  }
}
</script>

<template>
  <div
    class="cursor-pointer"
    @dblclick="startEditing"
  >
    <div
      v-if="isEditing"
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { duration: 150 } }"
      class="w-full"
    >
      <Input
        v-model="editingValue"
        class="h-8 border border-border border-solid text-sm"
        autofocus
        @keydown="handleKeydown"
        @blur="saveEdit"
      />
    </div>
    <div
      v-else
      class="group relative max-w-[160px] truncate rounded px-2 py-1 text-sm transition-all duration-200 -mx-2 -my-1 hover:bg-muted/50"
      :title="entry.translations[locale]"
      @click="startEditing"
    >
      <span
        v-if="entry.translations[locale]"
        :class="{
          'text-green-600 font-medium': entry.isModified
            && entry.translations[locale] !== entry.originalTranslations?.[locale],
        }"
      >
        {{ entry.translations[locale] }}
      </span>
      <span v-else class="text-muted-foreground italic">
        (未翻译)
      </span>

      <!-- 复制按钮 -->
      <Button
        v-if="entry.translations[locale]"
        variant="ghost"
        size="sm"
        class="absolute right-0 top-0 h-full w-6 opacity-0 transition-opacity group-hover:opacity-100"
        @click.stop="copyFieldValue"
      >
        <i
          v-if="copyingField"
          class="i-lucide-check h-3 w-3 text-green-600"
        />
        <i
          v-else
          class="i-lucide-copy h-3 w-3"
        />
      </Button>
    </div>
  </div>
</template>
