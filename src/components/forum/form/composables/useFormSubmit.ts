import type ForumAPI from '@/apis/forum/api'
import type { TopicFormTransactionResult, TopicFormTransactionStage } from '~/services/forum/form/topicFormTransaction'
import type { TopicFormData } from '~/services/forum/form/validation'
import { ref } from 'vue'
import { uploadImg } from '@/apis/interknot.site/upload'
import { calculateThumbHashForFile } from '@/composables/calculateThumbHashForFile'
import { useImageAttachmentQueue } from '~/composables/useImageAttachmentQueue'
import { useSubmitTopic } from '~/composables/useSubmitTopic'
import { submitTopicFormTransaction } from '~/services/forum/form/topicFormTransaction'

export function useFormSubmit() {
  const { submitData } = useSubmitTopic()
  const queue = useImageAttachmentQueue({
    upload: uploadImg,
    prepare: async file => calculateThumbHashForFile(new Uint8Array(await file.arrayBuffer())),
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
