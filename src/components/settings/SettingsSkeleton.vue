<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useLocalized } from '@/hooks/useLocalized'
import AsyncContentLoading from '~/components/AsyncContentLoading.vue'
import { useSitePreferences } from '~/composables/useSitePreferences'

defineOptions({ inheritAttrs: false })
defineProps<{ embeddedMobile?: boolean, error?: Error }>()
const emit = defineEmits<{ close: [], retry: [] }>()
const { message } = useLocalized()
const { desktopUi } = useSitePreferences()
</script>

<template>
  <template v-if="desktopUi && !embeddedMobile">
    <aside class="settings-dialog-sidebar settings-skeleton-sidebar" aria-hidden="true">
      <Skeleton class="mb-8 h-10 w-32" />
      <Skeleton v-for="item in 5" :key="item" class="rounded-lg h-9 w-full" />
    </aside>
    <section class="settings-dialog-main">
      <header class="settings-dialog-panel-header">
        <h2 class="settings-dialog-title">
          {{ message.settings.title }}
        </h2>
      </header>
      <div class="settings-dialog-content">
        <AsyncContentLoading :error="error" @retry="emit('retry')" />
      </div>
    </section>
  </template>
  <div v-else class="p-4">
    <Button variant="ghost" :aria-label="message.settings.close" @click="emit('close')">
      {{ message.ui.button.close }}
    </Button>
    <AsyncContentLoading :error="error" @retry="emit('retry')" />
  </div>
</template>
