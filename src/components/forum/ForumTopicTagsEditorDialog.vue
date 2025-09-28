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
import { useTopicManger } from '~/composables/useTopicManger'
import { useTopicTagsEditor } from '~/composables/useTopicTagsEditor'
import ForumTagsInput from './form/publish-topic-form/ForumTagsInput.vue'

const { open, topic } = useTopicTagsEditor()
const { message } = useLocalized()

const tags = ref<string[]>(topic.value?.tags ?? [])
const tagsInputRef = ref<InstanceType<typeof ForumTagsInput>>()

function handleSubmit() {
  if (!topic.value)
    return

  // Commit the local tags to the v-model
  tagsInputRef.value?.commitTags()

  const { replaceTopicTags } = useTopicManger(topic.value, message)
  replaceTopicTags(tags.value)
  open.value = false
}

function handleCancel() {
  // Reset local tags to original values
  tagsInputRef.value?.resetTags()
}

watch(topic, (newVal) => {
  if (newVal?.tags) {
    tags.value = newVal?.tags
    // localTags will be automatically synced via useTagsInput watch
  }
})
</script>

<template>
  <Dialog v-if="topic" v-model:open="open">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>编辑 Topic Tags (#{{ topic.id }})</DialogTitle>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <ForumTagsInput ref="tagsInputRef" v-model="tags" :max="10" />
      </div>
      <DialogFooter class="sm:justify-start">
        <DialogClose as-child>
          <Button type="button" variant="default" @click="handleSubmit">
            提交
          </Button>
          <Button type="button" variant="secondary" class="mt-8" @click="handleCancel">
            取消
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
