<script setup lang="ts">
import { useData, useRouter, withBase } from 'vitepress'
import { onBeforeUnmount, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { getLangPath } from '@/utils'
import { defineRecoverableAsyncComponent } from '~/components/defineRecoverableAsyncComponent'
import { closeSettingsDialog, closeSettingsPage, consumeSettingsReturnUrl } from '~/services/settingsNavigation'
import { loadSettingsContent } from './settingsLoader'
import SettingsShell from './SettingsShell.vue'
import SettingsSkeleton from './SettingsSkeleton.vue'

const props = defineProps<{ dialogOnly?: boolean, embeddedMobile?: boolean }>()
const emit = defineEmits<{ close: [], leave: [] }>()
const { message } = useLocalized()
const { localeIndex } = useData()
const router = useRouter()
const title = ref(message.value.settings.title)
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
  <SettingsShell :embedded-mobile="embeddedMobile" :title="title" @close="close">
    <SettingsContent :dialog-only="dialogOnly" :embedded-mobile="embeddedMobile" @title="title = $event" @close="close" @leave="emit('leave')" />
  </SettingsShell>
</template>
