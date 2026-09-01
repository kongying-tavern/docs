<script setup lang="ts">
import { ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLocalized } from '@/hooks/useLocalized'
import { useTopicManager } from '~/composables/useTopicManager'
import { useTopicTagsEditor } from '~/composables/useTopicTagsEditor'
import { getEditableTopicLabels } from '~/services/forum/forumTopicLabels'
import ForumTagsInput from '../form/publish-topic-form/ForumTagsInput.vue'

const { open, topic } = useTopicTagsEditor()
const { message } = useLocalized()
const { replaceTopicTags, updatingTopic } = useTopicManager(topic, message)

const tags = ref<string[]>(getEditableTopicLabels(topic.value?.tags ?? []))

async function handleSubmit() {
  if (!topic.value)
    return

  const result = await replaceTopicTags(tags.value)
  if (result)
    open.value = false
}

function handleCancel() {
  tags.value = getEditableTopicLabels(topic.value?.tags ?? [])
}

watch([topic, open], ([newTopic, isOpen]) => {
  if (isOpen)
    tags.value = getEditableTopicLabels(newTopic?.tags ?? [])
})
</script>

<template>
  <Dialog v-if="topic" v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>
          {{ message.forum.topic.menu.modifyTags.title.replace('{id}', String(topic.id)) }}
        </DialogTitle>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <ForumTagsInput v-model="tags" />
      </div>
      <DialogFooter class="sm:justify-start">
        <Button type="button" variant="default" :disabled="updatingTopic" @click="handleSubmit">
          {{ updatingTopic ? message.ui.button.loading : message.ui.button.submit }}
        </Button>
        <DialogClose as-child>
          <Button type="button" variant="secondary" :disabled="updatingTopic" @click="handleCancel">
            {{ message.ui.button.cancel }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
