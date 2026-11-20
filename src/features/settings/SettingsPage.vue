<script setup lang="ts">
import { getLangPath } from '@theme/utils.ts'
import { useData, useRouter, withBase } from 'vitepress'
import { onBeforeUnmount, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { defineRecoverableAsyncComponent } from '@/src/components/async/defineRecoverableAsyncComponent.ts'
import { loadSettingsContent } from './settingsLoader.ts'
import { closeSettingsDialog, closeSettingsPage, consumeSettingsReturnUrl } from './settingsNavigation.ts'
import SettingsShell from './SettingsShell.vue'
import SettingsSkeleton from './SettingsSkeleton.vue'

const props = defineProps<{ dialogOnly?: boolean, embeddedMobile?: boolean }>()
const emit = defineEmits<{ close: [], leave: [] }>()
const { t } = useI18n({ useScope: 'global' })
const { localeIndex } = useData()
const router = useRouter()
const title = ref('')
const SettingsContent = defineRecoverableAsyncComponent(loadSettingsContent, SettingsSkeleton)
function close(): void {
  if (props.embeddedMobile)
    emit('close')
  else if (props.dialogOnly)
    closeSettingsDialog()
  else
    closeSettingsPage(url => router.go(url), withBase(`${getLangPath(localeIndex.value)}feedback`))
}
onBeforeUnmount(() => {
  if (props.dialogOnly && !props.embeddedMobile)
    consumeSettingsReturnUrl()
})
</script>

<template>
  <SettingsShell :embedded-mobile="embeddedMobile" :title="title || t('settings.title')" @close="close">
    <SettingsContent :dialog-only="dialogOnly" :embedded-mobile="embeddedMobile" @title="title = $event" @close="close" @leave="emit('leave')" />
  </SettingsShell>
</template>
