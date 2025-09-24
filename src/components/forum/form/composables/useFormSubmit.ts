import type ForumAPI from '@/apis/forum/api'
import type { Ref } from 'vue'
import { useImageUpload } from '~/composables/useImageUpload'
import { useSubmitTopic } from '~/composables/useSubmitTopic'

export function useFormSubmit() {
  const { loading: submitLoading, submitData } = useSubmitTopic()
  const {
    isCompleted,
    markdownFormatImages,
    resetImageList,
    imageList,
    upload,
  } = useImageUpload()

  async function handleSubmit(
    formData: Ref<ForumAPI.CreateTopicOption>,
    onSuccess?: () => void,
    onError?: (error: Error) => void,
  ): Promise<void> {
    try {
      await submitData({
        ...formData.value,
        text: formData.value.text + markdownFormatImages.value,
      })

      onSuccess?.()
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error('Submission failed')
      onError?.(err)
      throw err
    }
  }

  function resetForm(): void {
    resetImageList()
  }

  return {
    // State
    submitLoading,
    isCompleted,
    imageList,
    markdownFormatImages,

    // Actions
    handleSubmit,
    resetForm,
    upload,
  }
}
