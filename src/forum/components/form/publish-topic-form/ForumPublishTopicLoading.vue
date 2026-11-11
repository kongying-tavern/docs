<script setup lang="ts">
import type { PublishTopicController } from '../composables/usePublishTopicController'
import { XIcon } from '@lucide/vue'
import { createReusableTemplate, useBrowserLocation, useMediaQuery } from '@vueuse/core'
import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import AsyncLoadError from '~/components/AsyncLoadError.vue'
import { useRuleChecks } from '~/forum/composables/auth/useRuleChecks'
import { resolvePublishTopicType } from '~/forum/services/form/publishTopicEntry'
import { readQuotedTopicRequest } from '~/forum/services/forumTopicQuote'
import { getFormTabsConfig } from './form-config'
import './publish-topic-panel.css'

defineOptions({ inheritAttrs: false })
const props = defineProps<{
  error?: Error
  form?: Pick<PublishTopicController['form'], 'choosingType' | 'formData' | 'formTabs'>
}>()
const emit = defineEmits<{ close: [], retry: [] }>()
const { t } = useI18n({ useScope: 'global' })
const isDesktop = useMediaQuery('(min-width: 768px)')
const location = useBrowserLocation()
const { hasAnyPermissions } = useRuleChecks()
const hasPermission = hasAnyPermissions('manage_feedback')
const tabs = computed(() => (props.form?.formTabs.value ?? getFormTabsConfig(t, hasPermission)).filter(tab => unref(tab.condition)))
const targetType = computed(() => props.form?.formData.value.type ?? resolvePublishTopicType(
  location.value.hash ?? '',
  tabs.value.map(tab => tab.value),
  location.value.href ? readQuotedTopicRequest(location.value.href)?.type : undefined,
))
const choosingType = computed(() => props.form?.choosingType.value ?? !targetType.value)
const hasTitle = computed(() => Boolean(tabs.value.find(tab => tab.value === targetType.value)?.fields.title))
const [DefineContent, Content] = createReusableTemplate()
</script>

<template>
  <DefineContent>
    <Button type="button" variant="ghost" size="icon-xs" class="compact-close compact-corner-button" :aria-label="t('ui.button.close')" @click="emit('close')">
      <XIcon class="size-3.5" />
    </Button>
    <div class="publish-loading" :class="{ 'compact-form': !choosingType }" role="status" aria-live="polite" :aria-busy="!error" data-publish-loading>
      <span class="sr-only">{{ error ? t('ui.asyncContent.failed') : t('ui.button.loading') }}</span>
      <AsyncLoadError v-if="error" class="publish-loading-error" @retry="emit('retry')" />
      <section v-if="choosingType" class="publish-loading-chooser" aria-hidden="true">
        <header>
          <h2 class="text-lg text-foreground font-semibold">
            {{ t('forum.publish.feedbackForm.chooseType') }}
          </h2>
          <p class="text-sm text-muted-foreground mt-2">
            {{ t('forum.publish.feedbackForm.chooseTypeDescription') }}
          </p>
        </header>
        <div class="mt-6 flex flex-col gap-2">
          <Skeleton v-for="tab in tabs" :key="tab.value" class="h-14 w-full srounded-lg" />
        </div>
      </section>
      <template v-else>
        <header class="compact-header" aria-hidden="true">
          <div class="compact-heading">
            <Skeleton class="rounded-full h-8 w-23" />
            <Skeleton class="h-3.5 w-16" />
          </div>
          <Skeleton class="rounded-full size-8" />
        </header>
        <div class="compact-body" aria-hidden="true">
          <div v-if="hasTitle" class="publish-loading-title mb-4">
            <Skeleton class="h-full w-36" />
          </div>
          <div class="compact-content-field">
            <Skeleton class="mt-1 h-4 w-3/5" />
          </div>
          <div class="compact-empty-uploader mt-2" />
          <div class="compact-properties flex gap-1.5">
            <Skeleton class="publish-loading-property rounded-full w-17" />
            <Skeleton class="publish-loading-property rounded-full w-23" />
          </div>
        </div>
        <footer class="compact-footer" aria-hidden="true">
          <Skeleton class="rounded-full size-8" />
          <div class="compact-footer-actions">
            <Skeleton class="h-5 w-28" />
            <Skeleton class="rounded-full h-8 w-20" />
          </div>
        </footer>
      </template>
    </div>
  </DefineContent>
  <Dialog v-if="isDesktop" :open="true" @update:open="open => !open && emit('close')">
    <DialogContent class="compact-dialog srounded-[var(--compact-radius)]" :show-close-button="false">
      <DialogTitle class="sr-only">
        {{ t('forum.publish.feedbackForm.newFeedback') }}
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ t('ui.button.loading') }}
      </DialogDescription>
      <Content />
    </DialogContent>
  </Dialog>
  <Drawer v-else :open="true" @update:open="open => !open && emit('close')">
    <DrawerContent class="compact-drawer data-[vaul-drawer-direction=bottom]:srounded-t-[var(--compact-radius)]" :class="{ 'compact-choosing-type': choosingType }" :aria-describedby="undefined">
      <DrawerTitle class="sr-only">
        {{ t('forum.publish.feedbackForm.newFeedback') }}
      </DrawerTitle>
      <Content />
    </DrawerContent>
  </Drawer>
</template>

<style scoped>
.publish-loading {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1 1 auto;
}
.publish-loading-chooser {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  padding: var(--compact-inset);
}
.publish-loading-chooser > header {
  padding-inline-end: calc(var(--compact-control-size) + 16px);
}
.publish-loading-title {
  @apply text-ui-22;
  line-height: 1.5;
  height: 1lh;
}
.publish-loading-property {
  height: 24px;
}
.publish-loading-error {
  position: absolute;
  inset: 0;
  background: oklch(var(--background));
  padding: calc(var(--compact-inset) + var(--compact-control-size)) var(--compact-inset);
}
@media (max-width: 767px) {
  .publish-loading-property {
    height: var(--compact-control-size);
  }
}
</style>
