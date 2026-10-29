import type { Composer } from 'vue-i18n'
import type { ImageAttachmentError } from '~/forum/services/form/imageAttachment'
import { IMAGE_UPLOAD_POLICY } from '~/forum/services/forumConfig'
import { FORM_HASH } from '../form/publish-topic-form/form-config'

export function formatImageAttachmentError(
  error: ImageAttachmentError,
  t: Composer['t'],
): string {
  const values = {
    filename: error.fileName,
    size: IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL,
    max: IMAGE_UPLOAD_POLICY.MAX_COUNT,
  }
  switch (error.code) {
    case 'count-exceeded': return t('forum.publish.feedbackForm.imageCountExceeded', values)
    case 'empty-file': return t('forum.publish.feedbackForm.imageEmpty', values)
    case 'invalid-type': return t('forum.publish.feedbackForm.imageInvalidType', values)
    case 'size-exceeded': return t('forum.publish.feedbackForm.imageTooLarge', values)
    case 'preview-failed': return t('forum.publish.feedbackForm.previewFailed', values)
    default: return t('forum.publish.feedbackForm.uploadFailed')
  }
}

interface DataNode {
  text: string
  link?: string
  items?: DataNode[]
}

interface FlattenedNode {
  text: string
  link: string
  tag: string
}

export function flattenWithTags(
  nodes: DataNode[],
  topLevelText?: string,
): FlattenedNode[] {
  const result: FlattenedNode[] = []

  nodes.forEach((node) => {
    const currentTopLevelText = topLevelText || node.text

    if (node.link) {
      result.push({
        text: node.text,
        link: node.link,
        tag: currentTopLevelText,
      })
    }
    if (node.items) {
      result.push(...flattenWithTags(node.items, currentTopLevelText))
    }
  })

  return result
}

let publishFormPreload: Promise<boolean> | undefined

/** 发布表单含 tiptap 编辑器（~154kB Brotli）；入口 hover/聚焦/点击时预热，避免直达时可感知加载 */
export function preloadForumPublishForm(): Promise<boolean> {
  publishFormPreload ??= Promise.all([
    import('~/forum/components/form/publish-topic-form/ForumPublishTopicForm.vue'),
    import('~/forum/components/form/publish-topic-form/ForumCompactPublishTopicPanel.vue'),
  ]).then(() => true).catch(() => {
    publishFormPreload = undefined
    return false
  })
  return publishFormPreload
}

export function publishTopic() {
  preloadForumPublishForm()
  const currentHash = location.hash.slice(1)
  let targetHash = FORM_HASH

  if (location.hash && ['FEAT', 'BUG', 'ANN'].includes(currentHash)) {
    targetHash = `${targetHash}-${currentHash}`
  }

  location.hash = targetHash
}
