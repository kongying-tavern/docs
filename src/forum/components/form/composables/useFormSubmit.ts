import type { ComputedRef } from 'vue'
import type ForumAPI from '~/forum/api/types'
import type { TopicFormTransactionResult, TopicFormTransactionStage } from '~/forum/services/form/topicFormTransaction'
import type { TopicFormData } from '~/forum/services/form/validation'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { uploadImg } from '~/apis/interknot.site/upload'
import { useSubmitTopic } from '~/forum/composables/data/useSubmitTopic'
import { calculateThumbHashForFile } from '~/forum/composables/view/calculateThumbHashForFile'
import { useImageAttachmentQueue } from '~/forum/composables/view/useImageAttachmentQueue'
import { readTopicDraft } from '~/forum/services/form/topicDraft'
import { submitTopicFormTransaction } from '~/forum/services/form/topicFormTransaction'

export function useFormSubmit(type: ComputedRef<TopicFormData['type']>, draftsEnabled: () => boolean = () => true) {
  const { submitData } = useSubmitTopic()
  const queues = new Map<TopicFormData['type'], ReturnType<typeof useImageAttachmentQueue>>()
  function getQueue(topicType: TopicFormData['type']) {
    let current = queues.get(topicType)
    if (!current) {
      current = useImageAttachmentQueue({ upload: uploadImg, prepare: calculateThumbHashForFile })
      if (draftsEnabled())
        current.restore(readTopicDraft(topicType).attachments ?? [])
      queues.set(topicType, current)
    }
    return current
  }
  watch(draftsEnabled, () => {
    for (const current of queues.values())
      current.reset()
    queues.clear()
  }, { flush: 'sync' })
  const queue = computed(() => {
    draftsEnabled()
    return getQueue(type.value)
  })
  onBeforeUnmount(() => {
    for (const current of queues.values())
      current.reset()
  })
  const submitLoading = ref(false)
  let activeSubmission: Promise<TopicFormTransactionResult> | undefined

  async function handleSubmit(
    draft: TopicFormData,
    canPublishAnnouncement: boolean,
    onSuccess?: (topic: ForumAPI.Topic) => void,
    onStage?: (stage: TopicFormTransactionStage) => void,
  ): Promise<TopicFormTransactionResult> {
    if (activeSubmission)
      return activeSubmission

    submitLoading.value = true
    // Include queue initialization in the task so every exit releases the lock.
    activeSubmission = Promise.resolve().then(() => {
      const submittingQueue = getQueue(draft.type)
      return submitTopicFormTransaction({
        draft,
        canPublishAnnouncement,
        settleUploads: submittingQueue.settleUploads,
        getUploadedAttachments: () => submittingQueue.serializedAttachments.value,
        submitTopic: submitData,
        onStage,
        onSuccess,
      })
    }).finally(() => {
      submitLoading.value = false
      activeSubmission = undefined
    })
    return activeSubmission
  }

  return {
    attachments: computed(() => queue.value.attachments.value),
    progress: computed(() => queue.value.progress.value),
    serializedAttachments: computed(() => queue.value.serializedAttachments.value),
    addFiles: (files: File[]) => queue.value.addFiles(files),
    settleUploads: () => queue.value.settleUploads(),
    remove: (id: string) => queue.value.remove(id),
    retry: (id: string) => queue.value.retry(id),
    reset: (topicType = type.value) => getQueue(topicType).reset(),
    restore: (images: ForumAPI.ImageInfo[]) => queue.value.restore(images),
    getQueue,
    submitLoading,
    handleSubmit,
  }
}
