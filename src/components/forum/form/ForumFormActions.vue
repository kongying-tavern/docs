<script setup lang="ts">
import type { FormTabConfig } from './publish-topic-form/types'
import { ReloadIcon } from '@radix-icons/vue'
import { useMediaQuery } from '@vueuse/core'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { DrawerClose, DrawerFooter } from '@/components/ui/drawer'
import { useLocalized } from '@/hooks/useLocalized'

interface Props {
  loading: boolean
  disabled: boolean
  isDesktop?: boolean
  nextTab?: FormTabConfig
  inTransition: boolean
}

interface Emits {
  (e: 'submit'): void
  (e: 'switch-tab'): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  isDesktop: true,
})

const emit = defineEmits<Emits>()
const { message } = useLocalized()
const isDesktop = useMediaQuery('(min-width: 768px)')

function handleSubmit(): void {
  if (!props.disabled && !props.loading) {
    emit('submit')
  }
}

function handleSwitchTab(): void {
  emit('switch-tab')
}

function handleClose(): void {
  emit('close')
}
</script>

<template>
  <!-- Desktop Actions -->
  <template v-if="isDesktop">
    <!-- Action Bar (Desktop) -->
    <div
      class="action-bar absolute top-[-70px] flex flex-col items-start md:rotate--1.4deg"
      style="left: calc(0px - (100vw - 780px) / 2)"
    >
      <DialogClose class="form-close-btn" @click="handleClose">
        <Button class="form-action-btn" type="button" variant="secondary">
          <span>{{ message.ui.button.close }}</span>
          <span class="i-lucide:x icon-btn" />
        </Button>
      </DialogClose>

      <Button
        v-if="nextTab"
        class="form-close-btn form-action-btn"
        type="button"
        variant="secondary"
        @click="handleSwitchTab"
      >
        <span>{{ nextTab.label }}</span>
        <span
          class="i-lucide:refresh-cw icon-btn"
          :class="{ 'animate-spin': inTransition }"
        />
      </Button>
    </div>

    <!-- Submit Footer (Desktop) -->
    <DialogFooter
      class="form-footer-container sticky bottom-0 mt-8 w-full flex flex-wrap py-4 md:rotate--1.4deg"
      :class="{ 'animate-switching': inTransition }"
    >
      <Button
        class="min-w-96px font-size-1.1em"
        variant="link"
        :disabled="disabled || loading"
        @click="handleSubmit"
      >
        <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? message.forum.publish.publishLoading : message.ui.button.submit }}
        »
      </Button>
    </DialogFooter>
  </template>

  <!-- Mobile Actions -->
  <template v-else>
    <DrawerFooter class="pt-4">
      <Button
        class="font-size-1.1em"
        variant="default"
        :disabled="disabled || loading"
        @click="handleSubmit"
      >
        <ReloadIcon v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? message.forum.publish.publishLoading : message.ui.button.submit }}
      </Button>

      <DrawerClose as-child @click="handleClose">
        <Button
          variant="outline"
          class="border border-color-[var(--vp-c-gutter)] border-solid"
        >
          {{ message.ui.button.cancel }}
        </Button>
      </DrawerClose>
    </DrawerFooter>
  </template>
</template>

<style lang="scss" scoped src="./ForumFormActions.scss"></style>
