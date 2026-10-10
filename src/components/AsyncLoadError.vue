<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useLocalized } from '@/hooks/useLocalized'

const emit = defineEmits<{ retry: [] }>()
const { message } = useLocalized()

function reload(): void {
  window.location.reload()
}
</script>

<template>
  <div class="space-y-4" role="alert" data-async-error>
    <p class="font-medium">
      {{ message.ui.asyncContent.failed }}
    </p>
    <p class="text-sm text-muted-foreground">
      {{ message.ui.chunkLoadRecovery.description }}
    </p>
    <div class="flex flex-wrap gap-2">
      <Button type="button" @click="emit('retry')">
        {{ message.ui.asyncContent.retry }}
      </Button>
      <Button type="button" variant="outline" @click="reload">
        {{ message.ui.chunkLoadRecovery.reload }}
      </Button>
    </div>
  </div>
</template>
