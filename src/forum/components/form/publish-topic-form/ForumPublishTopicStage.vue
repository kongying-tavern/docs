<script setup lang="ts">
import type { PublishTopicController } from '../composables/usePublishTopicController'
import { createReusableTemplate } from '@vueuse/core'
import { nextTick, onBeforeUnmount, ref, unref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'
import { useSitePreferences } from '~/composables/useSitePreferences'
import ForumTopicTypeBadge from '~/forum/components/ui/ForumTopicTypeBadge.vue'
import { preparePublishTypeMotion } from '~/forum/components/utils/publishTopicTypeTransition'
import ForumPublishTopicListItem from './ForumPublishTopicListItem.vue'

const props = defineProps<{ form: PublishTopicController['form'], actions: PublishTopicController['actions'], morphType?: boolean, fixedHeight?: boolean, hideCloseButton?: boolean }>()
const { entryPage, choosingType, formTabs, isOpen } = props.form
const { message } = useLocalized()
const { reducedMotion } = useSitePreferences()
const typeMotionActive = ref(false)
const [DefineHeader, Header] = createReusableTemplate<{ title: string, description: string }>()
let typeMotion: ReturnType<typeof preparePublishTypeMotion> | undefined
const shell = useTemplateRef<HTMLElement>('shell')
function keepHeight(element: Element) {
  if (props.fixedHeight || typeMotionActive.value || reducedMotion.value)
    return
  if (shell.value) {
    shell.value.style.flex = 'none'
    shell.value.style.overflow = 'hidden'
    shell.value.style.height = `${element.getBoundingClientRect().height}px`
  }
}
function resize(element: Element) {
  if (props.fixedHeight || typeMotionActive.value || reducedMotion.value)
    return
  if (!shell.value)
    return
  const previousHeight = shell.value.style.height
  shell.value.style.height = ''
  const targetHeight = element.getBoundingClientRect().height
  shell.value.style.height = previousHeight
  // Commit the starting height before transitioning to the form's natural height.
  shell.value.getBoundingClientRect()
  shell.value.style.height = `${targetHeight}px`
}
function focusForm(element: Element) {
  if (typeMotionActive.value)
    return
  if (shell.value) {
    shell.value.style.height = ''
    shell.value.style.flex = ''
    shell.value.style.overflow = ''
  }
  if (entryPage.value === 'form')
    element.querySelector<HTMLElement>('input:not([type="hidden"]), [contenteditable="true"], textarea')?.focus({ preventScroll: true })
  else
    element.querySelector<HTMLElement>('[data-stage-focus]')?.focus({ preventScroll: true })
}
async function selectType(type: PublishTopicController['form']['formData']['value']['type'], event: MouseEvent) {
  if (typeMotionActive.value || !choosingType.value)
    return
  const source = event.currentTarget as HTMLElement
  if (!props.morphType || reducedMotion.value || !shell.value) {
    props.actions.selectInitialType(type)
    return
  }
  typeMotion = preparePublishTypeMotion(source, shell.value)
  typeMotionActive.value = true
  await nextTick()
  try {
    props.actions.selectInitialType(type)
    await nextTick()
    if (isOpen.value)
      await typeMotion?.play()
  }
  finally {
    typeMotion?.cancel()
    typeMotion = undefined
    typeMotionActive.value = false
    if (isOpen.value && shell.value)
      focusForm(shell.value)
  }
}
watch(isOpen, (open) => {
  if (!open) {
    typeMotion?.cancel()
  }
})
onBeforeUnmount(() => {
  typeMotion?.cancel()
})
</script>

<template>
  <DefineHeader v-slot="{ title, description }">
    <header class="flex gap-4 items-start justify-between">
      <div class="flex gap-2 min-w-0 items-start">
        <div class="min-w-0">
          <h2 class="text-lg text-foreground font-semibold">
            {{ title }}
          </h2>
          <p class="text-sm text-muted-foreground mt-2">
            {{ description }}
          </p>
        </div>
      </div>
      <Button v-if="!hideCloseButton" type="button" variant="ghost" size="icon-sm" class="shrink-0" :aria-label="message.ui.button.close" @click="actions.handleClose">
        <span class="i-lucide-x" aria-hidden="true" />
      </Button>
    </header>
  </DefineHeader>
  <div ref="shell" class="topic-stage-shell" :class="{ 'type-motion-active': typeMotionActive, 'motion-reduced': reducedMotion }">
    <Transition name="topic-stage" :mode="typeMotionActive || reducedMotion ? undefined : 'out-in'" :css="!typeMotionActive && !reducedMotion" @before-leave="keepHeight" @enter="resize" @after-enter="focusForm">
      <section v-if="choosingType" key="choose" data-publish-type-chooser class="topic-chooser" :class="{ 'external-close': hideCloseButton }">
        <Header :title="message.forum.publish.feedbackForm.chooseType" :description="message.forum.publish.feedbackForm.chooseTypeDescription" />
        <ul class="topic-entry-list mt-6 custom-scrollbar flex flex-col gap-2">
          <li v-for="tab in formTabs.filter(tab => unref(tab.condition))" :key="tab.value">
            <ForumPublishTopicListItem :aria-disabled="typeMotionActive" @click="selectType(tab.value, $event)">
              <ForumTopicTypeBadge data-publish-type-label :type="tab.value" />
            </ForumPublishTopicListItem>
          </li>
        </ul>
      </section>
      <div v-else key="form" data-publish-type-form class="topic-form-stage" :inert="typeMotionActive || undefined" :aria-hidden="typeMotionActive || undefined">
        <slot />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.topic-stage-shell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  corner-shape: inherit;
  flex: 1 1 auto;
  transition: height 140ms ease;
}
.topic-stage-shell.type-motion-active,
.topic-stage-shell.motion-reduced {
  transition: none;
}
.topic-chooser {
  padding: var(--compact-inset, 24px);
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
}
.topic-chooser > header {
  flex-shrink: 0;
}
.topic-entry-list {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}
.topic-chooser.external-close > header {
  padding-inline-end: calc(var(--compact-control-size, 32px) + 16px);
}
.topic-form-stage {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
  corner-shape: inherit;
}
.type-motion-active .topic-form-stage {
  opacity: 0;
}
.topic-stage-enter-active,
.topic-stage-leave-active {
  transition:
    opacity 140ms ease,
    transform 140ms ease;
}
.topic-stage-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.topic-stage-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
html[data-reduced-motion='true'] .topic-stage-shell,
html[data-reduced-motion='true'] .topic-stage-enter-active,
html[data-reduced-motion='true'] .topic-stage-leave-active {
  transition: none;
}
html[data-reduced-motion='true'] .topic-stage-enter-from,
html[data-reduced-motion='true'] .topic-stage-leave-to {
  transform: none;
}
</style>
