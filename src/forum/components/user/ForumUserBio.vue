<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import ForumProfileForm from './ForumProfileForm.vue'

const props = defineProps<{ user?: ForumAPI.User, editable: boolean }>()
const { message } = useLocalized()
const editing = ref(false)
const editorInitialized = ref(false)
const root = useTemplateRef<HTMLDivElement>('root')
watch([() => props.user?.login, () => props.editable], () => {
  editing.value = false
  editorInitialized.value = false
})
watch(editing, async (active) => {
  if (active) {
    editorInitialized.value = true
    await nextTick()
    root.value?.querySelector('textarea')?.focus()
  }
})
</script>

<template>
  <div ref="root" class="user-bio text-sm text-[var(--vp-c-text-2)] mt-2 sm:text-base">
    <ForumProfileForm
      v-if="editorInitialized && editable && user"
      v-show="editing"
      :user="user"
      bio-only
      @submitted="editing = false"
      @saved="editing = false"
      @failed="editing = true"
    />
    <button
      v-if="!editing && editable && user"
      type="button"
      class="bio-edit-trigger text-start w-full block"
      :aria-label="message.settings.profile.editBio"
      @click="editing = true"
    >
      <span class="whitespace-pre-wrap break-words">{{ user.bio || message.forum.labels.lazyPerson }}</span>
    </button>
    <p v-else-if="!editable" class="text-sm text-[var(--vp-c-text-2)] whitespace-pre-wrap break-words sm:text-base">
      {{ user?.bio || message.forum.labels.lazyPerson }}
    </p>
  </div>
</template>

<style scoped>
.user-bio {
  width: 100%;
  max-width: 30rem;
  min-width: 0;
}

.bio-edit-trigger {
  font: inherit;
  cursor: text !important;
}
</style>
