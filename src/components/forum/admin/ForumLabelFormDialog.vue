<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumLabelStore } from '~/composables/useForumLabelStore'
import {
  getFallbackLabelDisplay,
  getForumLabelPrefix,
  getLabelTextColor,
  usesReservedPrefix,
  validateForumLabelColor,
  validateForumLabelName,
} from '~/services/forum/forumLabelTaxonomy'
import { toast } from '~/services/telemetry/toast'

const props = defineProps<{
  open: boolean
  label?: GITEE.IssueLabel | null
  existingNames?: string[]
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'submitted': []
}>()

const HASH_PREFIX_REGEX = /^#/

const { message } = useLocalized()
const labelStore = useForumLabelStore()

const name = ref('')
const color = ref('999999')
const submitting = ref(false)

const isEditing = computed(() => Boolean(props.label))

const editablePrefix = computed(() =>
  props.label ? getForumLabelPrefix(props.label.name) : '',
)

const fullName = computed(() => `${editablePrefix.value}${name.value.trim()}`)

const nameError = computed(() => {
  const code = validateForumLabelName(
    fullName.value,
    (props.existingNames ?? []).filter(
      existing => !props.label || existing.toLowerCase() !== props.label.name.toLowerCase(),
    ),
  )
  if (!code)
    return ''
  return message.value.forum.labelAdmin.errors[code]
})

const colorError = computed(() =>
  validateForumLabelColor(color.value)
    ? ''
    : message.value.forum.labelAdmin.errors.colorInvalid,
)

const reservedWarning = computed(() =>
  !props.label && usesReservedPrefix(fullName.value)
    ? message.value.forum.labelAdmin.reservedNameWarning
    : '',
)

const canSubmit = computed(() =>
  !submitting.value && !nameError.value && !colorError.value && name.value.trim() !== '',
)

const displayLabel = computed(() => fullName.value || props.label?.name || '')
const colorInputValue = computed(() =>
  validateForumLabelColor(color.value) ? `#${color.value}` : '#999999',
)

watch(() => [props.open, props.label] as const, ([open]) => {
  if (!open)
    return
  name.value = props.label
    ? props.label.name.slice(getForumLabelPrefix(props.label.name).length)
    : ''
  color.value = normalizeHexColor(props.label?.color || '999999')
})

function normalizeHexColor(value: string): string {
  return value.trim().replace(HASH_PREFIX_REGEX, '').toUpperCase()
}

function close() {
  emit('update:open', false)
}

function onHexInput(value: string | number): void {
  color.value = String(value).replace(HASH_PREFIX_REGEX, '').toUpperCase()
}

function onColorInput(event: Event): void {
  onHexInput((event.target as HTMLInputElement).value)
}

async function handleSubmit() {
  if (!canSubmit.value)
    return

  submitting.value = true
  try {
    if (props.label) {
      const updated = await labelStore.updateForumLabel(props.label.name, {
        ...(fullName.value !== props.label.name ? { name: fullName.value } : {}),
        color: color.value,
      })
      toast.success(
        message.value.forum.labelAdmin.updateSuccess.replace('{name}', updated.name),
      )
    }
    else {
      const created = await labelStore.createForumLabel(fullName.value, color.value)
      toast.success(
        message.value.forum.labelAdmin.createSuccess.replace('{name}', created.name),
      )
    }
    emit('submitted')
    close()
  }
  catch (error) {
    toast.error(
      message.value.forum.labelAdmin.operateFailed.replace(
        '{message}',
        error instanceof Error ? error.message : message.value.forum.errors.unknownError,
      ),
      { error, scene: 'op' },
    )
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>
          {{ isEditing ? message.forum.labelAdmin.edit : message.forum.labelAdmin.create }}
        </DialogTitle>
        <DialogDescription class="sr-only">
          {{ message.forum.labelAdmin.description }}
        </DialogDescription>
      </DialogHeader>

      <div :class="isEditing ? 'gap-4 grid grid-cols-2' : 'flex flex-col gap-4'">
        <div class="flex flex-col gap-1.5 min-w-0">
          <label class="text-sm font-medium" for="forum-label-name">
            {{ message.forum.labelAdmin.nameLabel }}
          </label>
          <div
            v-if="isEditing"
            class="px-3 outline-none border border-input rounded-md bg-transparent flex h-9 min-w-0 w-full transition-[color,box-shadow] items-center overflow-hidden focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
          >
            <span
              v-if="editablePrefix"
              class="text-sm text-[var(--vp-c-text-3)] font-mono shrink-0 select-none"
            >
              {{ editablePrefix }}
            </span>
            <input
              id="forum-label-name"
              v-model="name"
              :disabled="submitting"
              class="text-sm text-[var(--vp-c-text-1)] font-mono outline-none bg-transparent flex-1 h-full min-w-0 placeholder:text-muted-foreground disabled:opacity-50"
              autocomplete="off"
              spellcheck="false"
            >
          </div>
          <Input
            v-else
            id="forum-label-name"
            v-model="name"
            :placeholder="message.forum.labelAdmin.namePlaceholder"
            :disabled="submitting"
            autocomplete="off"
            spellcheck="false"
          />
          <p v-if="nameError" class="text-xs text-destructive" role="alert">
            {{ nameError }}
          </p>
          <p v-else-if="reservedWarning" class="text-xs text-[var(--vp-c-warning-1)]" role="alert">
            {{ reservedWarning }}
          </p>
          <p v-else-if="!isEditing" class="text-xs text-[var(--vp-c-text-3)]">
            {{ message.forum.labelAdmin.nameHint }}
          </p>
        </div>

        <div class="flex flex-col gap-1.5 min-w-0">
          <label class="text-sm font-medium" for="forum-label-color">
            {{ message.forum.labelAdmin.colorLabel }}
          </label>
          <div class="flex gap-2 items-center">
            <input
              id="forum-label-color"
              type="color"
              :value="colorInputValue"
              :aria-label="message.forum.labelAdmin.colorLabel"
              :disabled="submitting"
              class="p-1 border border-input rounded-md bg-transparent shrink-0 h-9 w-9 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              @input="onColorInput"
            >
            <Input
              :model-value="color"
              class="font-mono uppercase"
              maxlength="6"
              :disabled="submitting"
              @update:model-value="onHexInput"
            />
            <span
              v-if="!isEditing"
              class="text-xs font-medium ml-auto px-2.5 py-0.5 rounded-full inline-flex max-w-40 truncate items-center"
              :style="{
                backgroundColor: `#${color}`,
                color: getLabelTextColor(color),
              }"
            >
              {{ displayLabel || getFallbackLabelDisplay(name) }}
            </span>
          </div>
          <p v-if="colorError" class="text-xs text-destructive" role="alert">
            {{ colorError }}
          </p>
        </div>
      </div>

      <DialogFooter class="sm:justify-start">
        <Button type="button" :disabled="!canSubmit" @click="handleSubmit">
          {{ submitting ? message.ui.button.loading : message.ui.button.submit }}
        </Button>
        <DialogClose as-child>
          <Button type="button" variant="secondary" :disabled="submitting">
            {{ message.ui.button.cancel }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
