<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useDebounceFn } from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useLocalized } from '@/hooks/useLocalized'
import SettingsRow from '~/components/settings/SettingsRow.vue'
import SettingsSection from '~/components/settings/SettingsSection.vue'
import { useUserProfileEditor } from '~/forum/composables/data/useUserProfileEditor'
import { USER_PROFILE_FIELDS } from '~/forum/config/userProfile'
import { syncUserProfileDraft } from '~/forum/services/forumUserProfileOptimistic'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

const props = withDefaults(defineProps<{
  user: ForumAPI.User
  bioOnly?: boolean
}>(), { bioOnly: false })
const emit = defineEmits<{ saved: [], submitted: [], failed: [] }>()
const { message } = useLocalized()
const userInfo = useUserInfoStore()
const { save, saving } = useUserProfileEditor()
const fields = computed(() => USER_PROFILE_FIELDS.filter(field => !props.bioOnly || field.key === 'bio'))
const keys = computed(() => fields.value.map(field => field.key))
const original = reactive(Object.fromEntries(keys.value.map(key => [key, props.user[key] ?? ''])))
const draft = reactive({ ...original })
const error = ref('')
const saved = ref(false)
const dirty = computed(() => keys.value.some(key => draft[key] !== original[key]))
const fieldId = (key: string) => `profile-${props.bioOnly ? 'inline' : 'settings'}-${key}`
const form = useTemplateRef<HTMLFormElement>('form')
const scheduleSave = useDebounceFn(submit, 700)
// Defer our own optimistic update until it settles; other entry points can
// refresh untouched inputs without discarding local edits.
let submitting = false
watch(() => keys.value.map(key => props.user[key]), async () => {
  if (submitting)
    return
  syncUserProfileDraft(draft, original, props.user, keys.value)
  await nextTick()
  if (props.bioOnly)
    resizeBio()
})
onMounted(() => {
  if (props.bioOnly) {
    resizeBio()
    form.value?.querySelector('textarea')?.focus()
  }
})

function resizeBio(): void {
  const textarea = form.value?.querySelector('textarea')
  if (!textarea)
    return
  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight + 1}px`
}

async function submit(): Promise<void> {
  if (submitting || saving.value || !dirty.value || userInfo.info?.login !== props.user.login)
    return
  if (!form.value?.checkValidity())
    return
  error.value = ''
  saved.value = false
  const changes = Object.fromEntries(keys.value
    .filter(key => draft[key] !== original[key])
    .map(key => [key, draft[key]]))
  submitting = true
  try {
    const pending = save(changes)
    emit('submitted')
    const updated = await pending
    for (const key of keys.value.filter(key => key in changes)) {
      original[key] = updated[key] ?? ''
      if (draft[key] === changes[key])
        draft[key] = original[key]
    }
    // The parent may have received another field update while this request ran.
    await nextTick()
    syncUserProfileDraft(draft, original, props.user, keys.value)
    saved.value = true
    if (dirty.value)
      void scheduleSave()
    else
      emit('saved')
  }
  catch {
    await nextTick()
    syncUserProfileDraft(draft, original, props.user, keys.value)
    error.value = message.value.settings.profile.saveFailed
    emit('failed')
  }
  finally {
    submitting = false
  }
}
watch(draft, () => {
  if (dirty.value)
    void scheduleSave()
}, { deep: true })
</script>

<template>
  <form ref="form" class="profile-form" :class="{ 'is-inline': bioOnly }" :aria-busy="saving" @submit.prevent="submit" @focusout="submit">
    <textarea
      v-if="bioOnly"
      :id="fieldId('bio')"
      v-model="draft.bio"
      class="inline-bio"
      :aria-label="message.settings.profile.bio"
      rows="1"
      @input="resizeBio"
    />
    <SettingsSection v-else id="profile-form" :title="message.settings.profile.title">
      <slot name="before-rows" />
      <SettingsRow
        v-for="field in fields"
        :key="field.key"
        :title="message.settings.profile[field.key]"
        :label-for="fieldId(field.key)"
        :align-start="field.control === 'textarea'"
      >
        <Textarea
          v-if="field.control === 'textarea'"
          :id="fieldId(field.key)"
          v-model="draft[field.key]"
          :rows="4"
          :autocomplete="field.autocomplete"
          :placeholder="field.key === 'bio' ? message.forum.labels.lazyPerson : undefined"
        />
        <Input
          v-else
          :id="fieldId(field.key)"
          v-model="draft[field.key]"
          :required="field.required"
          :autocomplete="field.autocomplete"
        />
      </SettingsRow>
      <slot name="rows" />
    </SettingsSection>
    <div v-if="error" role="alert" class="text-sm text-destructive flex gap-2 items-center">
      <p>{{ error }}</p>
      <Button type="button" variant="link" size="xs" :disabled="saving" @click="submit">
        {{ message.settings.profile.retry }}
      </Button>
    </div>
    <p v-else-if="!bioOnly && saved && !dirty" role="status" class="text-sm text-muted-foreground">
      {{ message.settings.profile.saved }}
    </p>
  </form>
</template>

<style scoped>
.profile-form {
  display: grid;
  gap: 20px;
}

.profile-form.is-inline {
  gap: 0;
}

.inline-bio {
  display: block;
  width: 100%;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid var(--vp-c-divider);
  border-radius: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  box-shadow: none;
  outline: none;
  resize: none;
  cursor: text;
}

.profile-form :deep(.settings-row-control) {
  width: min(48%, 280px);
}

@media (max-width: 639px) {
  .profile-form :deep(.settings-row-control) {
    width: 100%;
  }
}
</style>
