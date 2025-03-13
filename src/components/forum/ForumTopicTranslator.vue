<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { translate } from '@/apis/inter-knot.site'
import BlurFade from '@/components/ui/BlurFade.vue'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/composables/useLanguage'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { getLangCode } from '@/utils'
import { useToggle } from '@vueuse/core'
import { isFunction } from 'lodash-es'
import { computed, watch } from 'vue'
import { useRequest } from 'vue-request'
import { toast } from 'vue-sonner'
import supportedLanguages from '~/_data/supportedLanguages.json'

interface Props {
  content: string
  sourceLanguage?: string
  targetLanguage?: string
  autoTranslate?: boolean
  serializer?: (content: string) => string
  defaultTargetLanguage?: string
  showDefaultTrigger?: boolean
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  autoTranslate: false,
  sourceLanguage: 'zh',
  defaultTargetLanguage: 'en',
  targetLanguage: 'en',
  showDefaultTrigger: false,
})
const emit = defineEmits<{
  (e: 'translated', content: string): void
  (e: 'close'): void
}>()

const { message } = useLocalized()

const [hideTranslation, toggleHideTranslation] = useToggle(!props.autoTranslate)

const { currentPageLang, matchedLang } = useLanguage(supportedLanguages, props.defaultTargetLanguage)

const _targetLanguage = computed(() => getLangCode((props.targetLanguage ?? matchedLang ?? currentPageLang.value ?? props.defaultTargetLanguage ?? props.defaultTargetLanguage)))
const _sourceLanguage = computed(() => getLangCode(props.sourceLanguage))

const { data, loading, error, runAsync } = useRequest(translate.translate, {
  manual: !props.autoTranslate,
})

const translatedContent = computed(() => data.value?.data.translatedText ?? '')
const displayText = computed(() => (isFunction(props.serializer) ? props.serializer(translatedContent.value) : translatedContent.value))
const showTranslation = computed(() => displayText.value.length > 0 && !hideTranslation.value)

async function startTranslate() {
  if (!loading.value) {
    toggleHideTranslation()
    if (!hideTranslation.value) {
      await runAsync(props.content, _targetLanguage.value, _sourceLanguage.value)
      emit('translated', translatedContent.value)
    }
  }
  if (hideTranslation.value)
    emit('close')
}

watch(error, (err) => {
  if (err) {
    toast.error(`${message.value.forum.translate.error} (${err.message})`)
    hideTranslation.value = true
    emit('close')
  }
})

defineExpose({
  startTranslate,
})
</script>

<template>
  <BlurFade v-if="_targetLanguage !== getLangCode(sourceLanguage || currentPageLang)" class="mt-2 w-full">
    <slot v-if="!showDefaultTrigger" name="trigger" @click="startTranslate" />
    <a v-if="showDefaultTrigger" class="font-size-4 vp-link" variant="link" @click="startTranslate">
      {{ showTranslation ? `> ${message.forum.translate.translateInfo}` : loading ? message.forum.translate.loading : message.forum.translate.translateText }}
    </a>
    <div v-if="!loading && showTranslation" :class="cn('mt-2 w-full whitespace-pre-wrap', props.class)" v-html="displayText" />
    <p v-if="!showDefaultTrigger && showTranslation" class="mt-2 w-full cursor-pointer text-center text-right text-sm color-[var(--vp-c-text-3)] hover:underline" @click="startTranslate">
      * {{ loading ? message.forum.translate.loading : message.forum.translate.translateInfo }}
    </p>
    <div v-if="loading && !hideTranslation" class="slide-enter mt-2 w-full">
      <Skeleton class="h-4 w-[100%]" />
      <Skeleton v-for="i in Math.max(content.split('\n').length, Math.ceil(content.length / 100))" :key="i" class="mt-2 h-4 w-[100%]" />
      <Skeleton class="mt-2 h-4 w-[80%]" />
    </div>
  </BlurFade>
</template>
