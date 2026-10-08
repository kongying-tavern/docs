<script setup lang="ts">
import type ForumAPI from '~/forum/api/types'
import { useClipboard } from '@vueuse/core'
import { computed, ref } from 'vue'
import { useLocalized } from '@/hooks/useLocalized'
import { toast } from '~/services/telemetry/toast'

const { state, topicId, iconOnly = false, copyable = false } = defineProps<{
  state: ForumAPI.TopicState
  topicId?: string | number
  iconOnly?: boolean
  copyable?: boolean
}>()

const { message } = useLocalized()
const { copy, copied, isSupported } = useClipboard({ legacy: true })
const copying = ref(false)
// Gitee 的 progressing 对应已结列表，closed 对应归档列表。
const label = computed(() => state === 'closed'
  ? message.value.forum.header.navigation.archivedFeedback
  : state === 'progressing' ? message.value.forum.topic.status.closed : message.value.forum.header.navigation.allFeedback)

async function copyTopicId() {
  if (topicId == null || copying.value)
    return
  copying.value = true
  try {
    await copy(String(topicId))
  }
  catch (error) {
    toast.error(message.value.forum.topic.menu.copyLink.fail, { error, scene: 'op' })
  }
  finally {
    copying.value = false
  }
}
</script>

<template>
  <span class="forum-topic-lifecycle">
    <span class="forum-topic-lifecycle-icon" :class="`is-${state}`" role="img" :title="label" :aria-label="label">
      <span v-if="state !== 'open'" :class="state === 'progressing' ? 'i-lucide-check' : 'i-lucide-x'" aria-hidden="true" />
    </span>
    <button
      v-if="!iconOnly && topicId != null && copyable && isSupported"
      type="button"
      class="forum-topic-id"
      :class="{ 'is-copied': copied }"
      :title="copied ? message.forum.topic.menu.copyLink.success : message.forum.topic.menu.copyId"
      :aria-label="`${message.forum.topic.menu.copyId} #${topicId}`"
      :disabled="copying"
      @pointerdown.stop
      @click.stop.prevent="copyTopicId"
    >
      <span>#{{ topicId }}</span>
      <span class="forum-topic-copy-icon" :class="copied ? 'i-lucide-check' : 'i-lucide-copy'" aria-hidden="true" />
    </button>
    <span v-else-if="!iconOnly && topicId != null" class="forum-topic-id">#{{ topicId }}</span>
  </span>
</template>

<style scoped>
.forum-topic-lifecycle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
  color: var(--vp-c-text-2);
  font-size: 12px;
}

.forum-topic-lifecycle-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.forum-topic-lifecycle-icon > span {
  width: 9px;
  height: 9px;
}

.is-open {
  border: 1px solid currentColor;
}

.is-progressing {
  background: var(--vp-c-green-3);
  color: var(--vp-c-white);
}

.is-closed {
  background: var(--vp-c-danger-3);
  color: var(--vp-c-white);
}

.forum-topic-id {
  font-variant-numeric: tabular-nums;
}

button.forum-topic-id {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

button.forum-topic-id:hover,
button.forum-topic-id:focus-visible,
button.forum-topic-id.is-copied {
  color: var(--vp-c-text-1);
}

.forum-topic-copy-icon {
  width: 0;
  height: 12px;
  opacity: 0;
  transition:
    width 0.15s,
    margin-left 0.15s,
    opacity 0.15s;
}

button.forum-topic-id:hover .forum-topic-copy-icon,
button.forum-topic-id:focus-visible .forum-topic-copy-icon,
button.forum-topic-id.is-copied .forum-topic-copy-icon {
  width: 12px;
  margin-left: 4px;
  opacity: 1;
}

button.forum-topic-id:focus-visible {
  outline: 2px solid oklch(var(--ring));
  outline-offset: 2px;
  border-radius: 2px;
}

@media (hover: none) {
  .forum-topic-copy-icon {
    width: 12px;
    margin-left: 4px;
    opacity: 1;
  }
}

html[data-reduced-motion='true'] .forum-topic-copy-icon {
  transition: none;
}
</style>
