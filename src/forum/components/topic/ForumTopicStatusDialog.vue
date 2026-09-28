<script setup lang="ts">
import type { ForumSelectOption } from '../ui/responsive/shared'
import type ForumAPI from '~/forum/api/forum'
import { ChevronDown } from '@lucide/vue'
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
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useForumRoute } from '~/forum/composables/useForumRoute'
import { useTopicManager } from '~/forum/composables/useTopicManager'
import { useTopicStatusEditor } from '~/forum/composables/useTopicStatusEditor'
import { getConclusiveTopicStatuses, groupTopicStatuses } from '~/forum/services/forumTopicStatus'
import ForumTopicStatusBadge from '../ui/ForumTopicStatusBadge.vue'
import ForumResponsiveSelect from '../ui/responsive/ForumResponsiveSelect.vue'
import { FORUM_SELECT_TRIGGER_CLASSES } from '../ui/responsive/shared'

const KEEP = '__keep__'

const { open, topic } = useTopicStatusEditor()
const { message } = useLocalized()
const { route, leaveTopic } = useForumRoute()
const { toggleCloseTopic, updatingTopic } = useTopicManager(topic, message)
const [, toggleClose] = toggleCloseTopic()
const selected = ref<ForumAPI.TopicStatus | typeof KEEP>(KEEP)

const options = computed(() => topic.value ? getConclusiveTopicStatuses(topic.value.type) : [])
const groupedOptions = computed(() => groupTopicStatuses(options.value))
const selectedStatus = computed<ForumAPI.TopicStatus | undefined>(() =>
  selected.value === KEEP ? undefined : selected.value,
)
const selectedText = computed(() => selectedStatus.value
  ? message.value.forum.topic.status[selectedStatus.value]
  : message.value.forum.topic.menu.closeFeedback.keepStatus)

type StatusOption = ForumSelectOption<ForumAPI.TopicStatus | typeof KEEP>

const statusOptions = computed<StatusOption[]>(() => {
  const flat: StatusOption[] = [{
    id: KEEP,
    label: message.value.forum.topic.menu.closeFeedback.keepStatus,
  }]
  for (const group of groupedOptions.value) {
    for (const definition of group.definitions) {
      flat.push({
        id: definition.id,
        label: message.value.forum.topic.status[definition.id],
        group: message.value.forum.topic.statusGroups[group.group],
      })
    }
  }
  return flat
})

async function handleSubmit() {
  if (!topic.value)
    return
  const originalId = String(topic.value.id)
  const status = selected.value === KEEP ? undefined : selected.value
  const result = await toggleClose(status)
  if (!result)
    return
  open.value = false
  if (result.state === 'closed' && route.value?.name === 'topic' && route.value.topicId === originalId)
    await leaveTopic()
}

watch([topic, open], ([, isOpen]) => {
  if (isOpen)
    selected.value = KEEP
}, { immediate: true })
</script>

<template>
  <Dialog v-if="topic" v-model:open="open">
    <DialogContent class="sm:max-w-[440px]">
      <DialogHeader>
        <DialogTitle>{{ message.forum.topic.menu.closeFeedback.title }}</DialogTitle>
        <DialogDescription>{{ message.forum.topic.menu.closeFeedback.confirm }}</DialogDescription>
      </DialogHeader>

      <ForumResponsiveSelect
        v-model="selected"
        :options="statusOptions"
        :title="message.forum.header.navigation.groups.status"
      >
        <template #trigger>
          <button
            type="button"
            data-size="default"
            :class="cn(FORUM_SELECT_TRIGGER_CLASSES, 'w-full')"
            :aria-label="`${message.forum.header.navigation.groups.status}：${selectedText}`"
          >
            <span class="flex gap-2 items-center">
              <ForumTopicStatusBadge :status="selectedStatus" />
              {{ selectedText }}
            </span>
            <ChevronDown class="opacity-50 shrink-0 size-4" />
          </button>
        </template>
        <template #prefix="{ option }">
          <ForumTopicStatusBadge :status="option.id === KEEP ? undefined : option.id" />
        </template>
      </ForumResponsiveSelect>

      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary" :disabled="updatingTopic">
            {{ message.ui.button.cancel }}
          </Button>
        </DialogClose>
        <Button
          type="button"
          variant="destructive"
          :disabled="updatingTopic"
          @click="handleSubmit"
        >
          {{ updatingTopic ? message.ui.button.loading : message.forum.topic.menu.closeFeedback.submit }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
