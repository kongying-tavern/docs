<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { TranslationResult } from '~/services/forum/forumTranslation'
import { useElementVisibility } from '@vueuse/core'
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import BlurFade from '@/components/ui/BlurFade.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/composables/useLanguage'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useForumTranslationPreferences } from '~/composables/forum/useForumTranslationPreferences'
import { translate, translateAuto } from '~/services/forum/forumTranslation'
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
  loading.value = true
  try {
    const result = await translateAuto(props.content, {
      sourceLanguage: props.sourceLanguage,
      targetLanguage: targetLanguage.value,
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
      toast.error(message.value.forum.translate.error)
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

watch(
  [visible, () => props.autoTranslate, autoTranslateEnabled, () => props.content],
  ([isVisible, autoTranslateProp, autoEnabled, content]) => {
    if (!isVisible || !autoEnabled || !autoTranslateProp || autoAttemptedFor === content)
      return
    autoAttemptedFor = content
    void startTranslate(false)
  },
  { immediate: true },
)

watch(autoTranslateEnabled, (enabled) => {
  if (!enabled && translation.value)
    reset()
})

watch(
  [() => props.content, () => props.sourceLanguage, targetLanguage],
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
    <BlurFade v-if="loading" class="my-2 w-full space-y-2" aria-live="polite">
      <Skeleton class="h-4 w-full" />
      <Skeleton class="h-4 w-4/5" />
    </BlurFade>

    <div
      v-else-if="translation"
      class="group text-sm c-[var(--vp-c-text-3)] leading-none mb-0 mt-0.5 flex gap-1.5 items-center"
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
