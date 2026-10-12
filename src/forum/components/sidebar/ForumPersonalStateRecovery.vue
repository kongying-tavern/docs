<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { useForumPersonalState } from '~/forum/composables/data/useForumPersonalState'
import { parseForumPersonalState } from '~/forum/services/forumPersonalState'
import { ForumPersonalStateConflictError, ForumPersonalStateCorruptionError } from '~/forum/services/forumPersonalStateRepository'
import { useUserAuthStore } from '~/forum/stores/auth/useUserAuth'
import { useUserInfoStore } from '~/forum/stores/auth/useUserInfo'

const { message } = useLocalized()
const personal = useForumPersonalState()
const auth = useUserAuthStore()
const userInfo = useUserInfoStore()
const labels = computed(() => message.value.forum.sidebar.personalRecovery)
const corruption = computed(() => personal.error.value instanceof ForumPersonalStateCorruptionError ? personal.error.value : null)
const canRecover = computed(() => corruption.value?.kind === 'corrupt' && typeof corruption.value.raw === 'string')
const salvage = computed(() => parseForumPersonalState(corruption.value?.raw))
const recoveredCount = computed(() => salvage.value.followedTopics.length + salvage.value.recentParticipated.length)
const selection = ref<'repair' | 'reset' | null>(null)
const actionError = ref(false)
const recovered = ref(false)
const retrying = ref(false)
const busy = computed(() => retrying.value || personal.loading.value || personal.saving.value)
const errorLabel = computed(() => {
  if (corruption.value?.kind === 'unsupported-version')
    return labels.value.unsupported
  if (corruption.value)
    return labels.value.corrupt
  return personal.error.value instanceof ForumPersonalStateConflictError ? labels.value.conflict : labels.value.readFailed
})
watch(() => [userInfo.info?.id, auth.getSessionGeneration()], () => {
  selection.value = null
  actionError.value = false
  recovered.value = false
})
watch(personal.error, () => {
  selection.value = null
})

async function retry(): Promise<void> {
  retrying.value = true
  actionError.value = false
  try {
    await personal.refetch()
  }
  catch {
    actionError.value = true
  }
  finally {
    retrying.value = false
  }
}

async function confirmRecovery(): Promise<void> {
  const error = corruption.value
  const mode = selection.value
  if (busy.value || !canRecover.value || !error || typeof error.raw !== 'string' || !mode)
    return
  actionError.value = false
  try {
    await personal.recover({ gistId: error.gistId, raw: error.raw, mode })
    recovered.value = true
    selection.value = null
  }
  catch {
    actionError.value = true
  }
}
</script>

<template>
  <div v-if="personal.error.value || recovered" class="personal-recovery" data-personal-state-recovery :aria-busy="busy">
    <template v-if="personal.error.value">
      <p role="alert">
        {{ errorLabel }}
      </p>
      <div class="personal-recovery-actions">
        <button type="button" :disabled="busy" @click="retry">
          {{ labels.retry }}
        </button>
        <template v-if="canRecover">
          <button v-if="recoveredCount" type="button" :disabled="busy" @click="selection = 'repair'">
            {{ labels.repair }}
          </button>
          <button type="button" :disabled="busy" @click="selection = 'reset'">
            {{ labels.reset }}
          </button>
        </template>
      </div>
      <div v-if="selection" class="personal-recovery-confirm">
        <p>{{ selection === 'repair' ? labels.repairConfirm.replace('{count}', String(recoveredCount)) : labels.resetConfirm }}</p>
        <div class="personal-recovery-actions">
          <button type="button" :disabled="busy" @click="confirmRecovery">
            {{ labels.confirm }}
          </button>
          <button type="button" :disabled="busy" @click="selection = null">
            {{ labels.cancel }}
          </button>
        </div>
      </div>
      <p v-if="actionError" role="alert">
        {{ labels.actionFailed }}
      </p>
    </template>
    <p v-else role="status">
      {{ labels.success }}
    </p>
  </div>
</template>

<style scoped>
.personal-recovery {
  margin: 8px 0;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-2);
  font-size: 12px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.personal-recovery-actions {
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
  cursor: wait;
}
.personal-recovery-confirm {
  margin-top: 12px;
}
</style>
