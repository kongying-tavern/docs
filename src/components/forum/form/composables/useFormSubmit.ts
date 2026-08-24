import type { TopicFormData } from '../../utils/validation'
import type { TopicFormTransactionResult } from './topicFormTransaction'
import type ForumAPI from '@/apis/forum/api'
import { computed, ref } from 'vue'
import { uploadImg } from '@/apis/interknot.site/upload'
import { calculateThumbHashForFile } from '@/composables/calculateThumbHashForFile'
import { useImageAttachmentQueue } from '~/composables/useImageAttachmentQueue'
import { useSubmitTopic } from '~/composables/useSubmitTopic'
import { submitTopicFormTransaction } from './topicFormTransaction'

export function useFormSubmit() {
  const { loading: topicSubmitLoading, submitData } = useSubmitTopic()
  const queue = useImageAttachmentQueue({
    upload: uploadImg,
    prepare: async file => calculateThumbHashForFile(new Uint8Array(await file.arrayBuffer())),
  })
  const submissionError = ref<Error>()
  const submitLoading = computed(() => topicSubmitLoading.value || queue.isBusy.value)

  async function handleSubmit(
    draft: TopicFormData,
    canPublishAnnouncement: boolean,
    onSuccess?: (topic: ForumAPI.Topic) => void,
  ): Promise<TopicFormTransactionResult> {
    submissionError.value = undefined
    const result = await submitTopicFormTransaction({
      draft,
      canPublishAnnouncement,
      uploadPending: queue.uploadPending,
      getUploadedAttachments: () => queue.serializedAttachments.value,
      submitTopic: submitData,
      onSuccess,
    })
    if (!result.ok)
      submissionError.value = result.error
    return result
  }

  return {
    ...queue,
    submitLoading,
    submissionError,
    handleSubmit,
  }
}
