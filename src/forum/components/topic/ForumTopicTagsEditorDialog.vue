<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTopicManager } from '~/forum/composables/state/useTopicManager'
import { useTopicTagsEditor } from '~/forum/composables/state/useTopicTagsEditor'
import { getEditableTopicLabels } from '~/forum/services/forumTopicLabels'
import ForumTagsInput from '../form/publish-topic-form/ForumTagsInput.vue'

const { open, topic } = useTopicTagsEditor()
const { t } = useI18n({ useScope: 'global' })
const { replaceTopicTags, updatingTopic } = useTopicManager(topic, t)

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
          {{ t('forum.topic.menu.modifyTags.title', { id: String(topic.id) }) }}
        </DialogTitle>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <ForumTagsInput v-model="tags" />
      </div>
      <DialogFooter>
        <DialogClose as-child>
          <Button type="button" variant="secondary" :disabled="updatingTopic" @click="handleCancel">
            {{ t('ui.button.cancel') }}
          </Button>
        </DialogClose>
        <Button type="button" variant="default" :disabled="updatingTopic" @click="handleSubmit">
          {{ updatingTopic ? t('ui.button.loading') : t('ui.button.submit') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
