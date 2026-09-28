<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TranslationResult } from '~/forum/services/translation'
import { useElementVisibility } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useLanguage } from '@/composables/useLanguage'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useForumTranslationPreferences } from '~/forum/composables/data/useForumTranslationPreferences'
import { translate, translateAuto } from '~/forum/services/translation'
import { toast } from '~/services/telemetry/toast'
import ForumTranslationSettingsMenu from './ForumTranslationSettingsMenu.vue'

const props = withDefaults(defineProps<{
  content: string
  title?: string
  sourceLanguage?: string | null
  targetLanguage?: string
  autoTranslate?: boolean
  class?: HTMLAttributes['class']
}>(), {
  autoTranslate: true,
})

const emit = defineEmits<{
  'translated': [content: string]
  'title-translated': [title: string]
  'close': []
}>()

const { message } = useLocalized()
const { currentPageLang } = useLanguage()
const {
  autoTranslateEnabled,
  excludedSourceLanguages,
  targetLanguage: preferredTargetLanguage,
} = useForumTranslationPreferences()
const root = useTemplateRef<HTMLElement>('root')
const visible = useElementVisibility(root)
const translation = ref<TranslationResult>()
const loading = ref(false)
const showingOriginal = ref(false)
let autoAttemptedFor = ''
let request: AbortController | undefined

const targetLanguage = computed(() => props.targetLanguage ?? preferredTargetLanguage.value)
const translatedFrom = computed(() => {
  const sourceLanguage = translation.value?.sourceLanguage
  if (!sourceLanguage)
    return ''
  try {
    return new Intl.DisplayNames([currentPageLang.value], { type: 'language', style: 'long' }).of(sourceLanguage) ?? sourceLanguage
  }
  catch {
    return sourceLanguage
  }
})
const translationLabel = computed(() => message.value.forum.translate.translatedFrom.replace(
  '{language}',
  translatedFrom.value,
))

async function startTranslate(manual = true): Promise<void> {
  if (translation.value) {
    showingOriginal.value = false
    emit('translated', translation.value.text)
    return
  }
  if (loading.value)
    return

  request?.abort()
  const controller = new AbortController()
  request = controller
  // 只有手动翻译才展示加载行。自动翻译是后台增强，且经常以「跳过/失败」收场，
  // 若在正文上方插入再移除加载行，会让不需要翻译的话题滚入视窗时上下跳一下。
  loading.value = manual
  try {
    const result = await translateAuto(props.content, {
      sourceLanguage: props.sourceLanguage,
      targetLanguage: targetLanguage.value,
      excludedSourceLanguages: manual ? undefined : excludedSourceLanguages.value,
      signal: controller.signal,
    })
    if (request !== controller)
      return
    if (result.status === 'translated') {
      translation.value = result
      showingOriginal.value = false
      emit('translated', result.text)
      if (props.title) {
        try {
          const titleResult = await translate(props.title, {
            sourceLanguage: result.sourceLanguage,
            targetLanguage: targetLanguage.value,
            signal: controller.signal,
          })
          if (request === controller && titleResult.provider !== 'passthrough')
            emit('title-translated', titleResult.text)
        }
        catch {
          // The translated body remains useful when the title model is unavailable.
        }
      }
    }
    else if (manual && result.reason !== 'same-language') {
      toast.info(message.value.forum.translate.conservativeSkip)
    }
  }
  catch (error) {
    if (!(error instanceof DOMException && error.name === 'AbortError'))
      toast.error(message.value.forum.translate.error, { error })
  }
  finally {
    if (request === controller) {
      request = undefined
      loading.value = false
    }
  }
}

function reset(): void {
  request?.abort()
  request = undefined
  translation.value = undefined
  showingOriginal.value = false
  autoAttemptedFor = ''
  emit('close')
}

function toggleOriginal(): void {
  if (!translation.value)
    return
  showingOriginal.value = !showingOriginal.value
  if (showingOriginal.value)
    emit('close')
  else
    emit('translated', translation.value.text)
}

const excludedSourceLanguagesKey = computed(() => excludedSourceLanguages.value.toSorted().join(','))

watch(
  [
    visible,
    () => props.autoTranslate,
    autoTranslateEnabled,
    () => props.content,
    () => props.sourceLanguage,
    targetLanguage,
    excludedSourceLanguagesKey,
  ],
  ([isVisible, autoTranslateProp, autoEnabled, content, sourceLanguage, target, excludedLanguages]) => {
    const attemptKey = JSON.stringify([content, sourceLanguage, target, excludedLanguages])
    if (!isVisible || !autoEnabled || !autoTranslateProp || autoAttemptedFor === attemptKey)
      return
    autoAttemptedFor = attemptKey
    void startTranslate(false)
  },
  { immediate: true },
)

watch(autoTranslateEnabled, (enabled) => {
  if (!enabled && translation.value)
    reset()
})

watch(
  [() => props.content, () => props.sourceLanguage, targetLanguage, excludedSourceLanguagesKey],
  () => {
    reset()
  },
  { flush: 'sync' },
)

onBeforeUnmount(() => request?.abort())

defineExpose({ startTranslate })
</script>

<template>
  <div ref="root" :class="cn('min-h-px w-full', props.class)">
    <div
      v-if="loading"
      class="forum-translation-status"
      aria-live="polite"
    >
      <span class="i-lucide-loader-circle shrink-0 size-4 animate-spin" aria-hidden="true" />
      <span class="truncate">{{ message.forum.translate.loading }}</span>
    </div>

    <div
      v-else-if="translation"
      class="forum-translation-status group"
    >
      <button
        type="button"
        class="flex gap-1.5 min-w-0 items-center hover:c-[var(--vp-c-text-1)]"
        :aria-pressed="showingOriginal"
        @click.stop.prevent="toggleOriginal"
      >
        <span class="i-lucide-languages shrink-0 size-4" aria-hidden="true" />
        <span class="truncate">{{ showingOriginal ? message.forum.translate.showTranslation : translationLabel }}</span>
      </button>
      <span class="opacity-0 transition-opacity group-hover:opacity-100 max-mobile:opacity-100">
        <ForumTranslationSettingsMenu />
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 加载态与译文信息共用同一行盒，翻译状态切换时正文不产生位移 */
.forum-translation-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.125rem;
  margin-bottom: 0;
  font-size: calc(14px * var(--site-ui-scale));
  line-height: 1;
  color: var(--vp-c-text-3);
}

@media (prefers-reduced-motion: reduce) {
  .animate-spin {
    animation: none;
  }
}
</style>
