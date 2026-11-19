<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n({ useScope: 'global' })

function reload(): void {
  window.location.reload()
}
</script>

<template>
  <div class="space-y-4" role="alert" data-async-error>
    <p class="font-medium">
      {{ t('ui.asyncContent.failed') }}
    </p>
    <p class="text-sm text-muted-foreground">
      {{ t('ui.chunkLoadRecovery.description') }}
    </p>
    <div class="flex flex-wrap gap-2">
      <Button type="button" @click="emit('retry')">
        {{ t('ui.asyncContent.retry') }}
      </Button>
      <Button type="button" variant="outline" @click="reload">
        {{ t('ui.chunkLoadRecovery.reload') }}
      </Button>
    </div>
  </div>
</template>
