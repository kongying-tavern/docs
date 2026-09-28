import type ForumAPI from '~/forum/api/types'
import type { TopicFormTransactionResult, TopicFormTransactionStage } from '~/forum/services/form/topicFormTransaction'
import type { TopicFormData } from '~/forum/services/form/validation'
import { ref } from 'vue'
import { uploadImg } from '~/apis/interknot.site/upload'
import { useSubmitTopic } from '~/forum/composables/data/useSubmitTopic'
import { calculateThumbHashForFile } from '~/forum/composables/view/calculateThumbHashForFile'
import { useImageAttachmentQueue } from '~/forum/composables/view/useImageAttachmentQueue'
import { submitTopicFormTransaction } from '~/forum/services/form/topicFormTransaction'

export function useFormSubmit() {
  const { submitData } = useSubmitTopic()
  const queue = useImageAttachmentQueue({
    upload: uploadImg,
    prepare: calculateThumbHashForFile,
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
    activeSubmission = submitTopicFormTransaction({
      draft,
      canPublishAnnouncement,
      settleUploads: queue.settleUploads,
      getUploadedAttachments: () => queue.serializedAttachments.value,
      submitTopic: submitData,
      onStage,
      onSuccess,
    }).finally(() => {
      submitLoading.value = false
      activeSubmission = undefined
    })
    return activeSubmission
  }

  return {
    ...queue,
    submitLoading,
    handleSubmit,
  }
}
