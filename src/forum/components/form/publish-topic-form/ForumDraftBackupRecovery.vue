<script setup lang="ts">
import type { TopicDraftBackup } from '~/forum/services/form/topicDraft'
import type { TopicFormData } from '~/forum/services/form/validation'
import { useEventListener } from '@vueuse/core'
import { computed, ref, shallowRef, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { canRestoreTopicDraftBackup, readTopicDraftBackup, readTopicDraftRaw, TOPIC_DRAFT_CHANGE_EVENT } from '~/forum/services/form/topicDraft'

const props = defineProps<{ type: TopicFormData['type'], disabled: boolean, restore: () => boolean }>()
const { message } = useLocalized()
const labels = computed(() => message.value.forum.publish.feedbackForm.draftRecovery)
const backup = shallowRef<TopicDraftBackup | null>(null)
const corruptBackup = shallowRef<TopicDraftBackup | null>(null)
const raw = ref<string | null>(null)
const canRestore = ref(false)
const confirming = ref(false)
const failed = ref(false)
const restored = ref(false)

function refresh(): void {
  backup.value = readTopicDraftBackup(props.type)
  corruptBackup.value = readTopicDraftBackup(props.type, 'corrupt')
  raw.value = readTopicDraftRaw(props.type)
  canRestore.value = canRestoreTopicDraftBackup(props.type)
}
watch(() => props.type, () => {
  refresh()
  confirming.value = false
  failed.value = false
  restored.value = false
}, { immediate: true })
useEventListener(TOPIC_DRAFT_CHANGE_EVENT, refresh)
useEventListener('storage', refresh)

function download(content: string | null | undefined): void {
  if (content == null)
    return
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `forum-draft-${props.type.toLowerCase()}-original.json`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function confirm(): void {
  if (props.disabled)
    return
  const result = props.restore()
  failed.value = !result
  restored.value = result
  if (result)
    confirming.value = false
  refresh()
}
</script>

<template>
  <details v-if="backup || corruptBackup || raw !== null" class="draft-recovery" data-draft-recovery>
    <summary>{{ labels.title }}</summary>
    <p>{{ labels.description }}</p>
    <div class="draft-recovery-actions">
      <button v-if="raw !== null" type="button" :disabled="disabled" @click="download(raw)">
        {{ labels.downloadCurrent }}
      </button>
      <button v-if="backup" type="button" :disabled="disabled" @click="download(backup.raw)">
        {{ labels.downloadBackup }}
      </button>
      <button v-if="corruptBackup && corruptBackup.raw !== backup?.raw" type="button" :disabled="disabled" @click="download(corruptBackup.raw)">
        {{ labels.downloadCorrupt }}
      </button>
      <button v-if="canRestore" type="button" :disabled="disabled" @click="confirming = true">
        {{ labels.restore }}
      </button>
    </div>
    <template v-if="confirming">
      <p>{{ labels.confirm }}</p>
      <div class="draft-recovery-actions">
        <button type="button" :disabled="disabled" @click="confirm">
          {{ labels.accept }}
        </button>
        <button type="button" :disabled="disabled" @click="confirming = false">
          {{ labels.cancel }}
        </button>
      </div>
    </template>
    <p v-if="failed" role="alert">
      {{ labels.failed }}
    </p>
    <p v-if="restored" role="status">
      {{ labels.success }}
    </p>
  </details>
</template>

<style scoped>
.draft-recovery {
  margin-bottom: 16px;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.6;
}
summary {
  cursor: pointer;
}
p {
  margin-top: 8px;
}
.draft-recovery-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
button {
  padding: 3px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  color: var(--vp-c-brand-1);
}
button:hover {
  background: var(--vp-c-default-soft);
}
button:disabled {
  opacity: 0.5;
}
</style>
