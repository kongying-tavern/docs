<script setup lang="ts">
import type { PublishTopicController } from '../composables/usePublishTopicController'
import { useEventListener } from '@vueuse/core'
import { nextTick, onBeforeUnmount, ref, unref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSitePreferences } from '~/composables/useSitePreferences'
import ForumTopicTypeBadge from '~/forum/components/ui/ForumTopicTypeBadge.vue'
import { preparePublishTypeMotion } from '~/forum/components/utils/publishTopicTypeTransition'
import ForumPublishTopicListItem from './ForumPublishTopicListItem.vue'

const props = defineProps<{ form: PublishTopicController['form'], actions: PublishTopicController['actions'], morphType?: boolean, fixedHeight?: boolean }>()
const { entryPage, choosingType, formTabs, formData, isOpen } = props.form
const { t } = useI18n({ useScope: 'global' })
const { reducedMotion } = useSitePreferences()
const typeMotionActive = ref(false)
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
  const motion = preparePublishTypeMotion(source, shell.value)
  typeMotion = motion
  typeMotionActive.value = true
  await nextTick()
  try {
    props.actions.selectInitialType(type)
    await nextTick()
    if (isOpen.value)
      await motion.play()
  }
  finally {
    motion.cancel()
    if (typeMotion === motion) {
      typeMotion = undefined
      typeMotionActive.value = false
      // Vue must remove inert before the newly revealed field can take focus.
      await nextTick()
      if (!typeMotion && isOpen.value && shell.value)
        focusForm(shell.value)
    }
  }
}
watch([isOpen, reducedMotion], ([open, reduced]) => {
  if (!open || reduced)
    typeMotion?.cancel()
})
useEventListener('resize', () => typeMotion?.cancel())
onBeforeUnmount(() => {
  typeMotion?.cancel()
})
</script>

<template>
  <div ref="shell" class="topic-stage-shell" :class="{ 'type-motion-active': typeMotionActive, 'motion-reduced': reducedMotion, 'stage-back': choosingType }">
    <Transition name="topic-stage" :mode="typeMotionActive || reducedMotion ? undefined : 'out-in'" :css="!typeMotionActive && !reducedMotion" @before-leave="keepHeight" @enter="resize" @after-enter="focusForm">
      <section v-if="choosingType" key="choose" data-publish-type-chooser class="topic-chooser">
        <header>
          <h2 class="text-lg text-foreground font-semibold">
            {{ t('forum.publish.feedbackForm.chooseType') }}
          </h2>
          <p class="text-sm text-muted-foreground mt-2">
            {{ t('forum.publish.feedbackForm.chooseTypeDescription') }}
          </p>
        </header>
        <ul class="topic-entry-list mt-6 custom-scrollbar flex flex-col gap-2">
          <li v-for="tab in formTabs.filter(tab => unref(tab.condition))" :key="tab.value">
            <ForumPublishTopicListItem :aria-disabled="typeMotionActive" :data-stage-focus="tab.value === formData.type ? '' : undefined" @click="selectType(tab.value, $event)">
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
  transition: height 160ms cubic-bezier(0.22, 0.8, 0.25, 1);
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
  padding-inline-end: calc(var(--compact-control-size, 32px) + 16px);
}
.topic-entry-list {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
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
    opacity 160ms cubic-bezier(0.22, 0.8, 0.25, 1),
    transform 160ms cubic-bezier(0.22, 0.8, 0.25, 1);
}
.topic-stage-leave-active {
  transition-duration: 100ms;
  pointer-events: none;
}
.topic-stage-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.topic-stage-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.stage-back .topic-stage-enter-from {
  transform: translateY(-4px);
}
.stage-back .topic-stage-leave-to {
  transform: translateY(4px);
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
