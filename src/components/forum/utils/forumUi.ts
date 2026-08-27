import type { CustomConfig } from '../../../../.vitepress/locales/types'
import type { ImageAttachmentError } from '~/services/forum/form/imageAttachment'
import { IMAGE_UPLOAD_POLICY } from '~/services/forum/forumConfig'
import { FORM_HASH } from '../form/publish-topic-form/config'

export function formatMessage(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  )
}

export function formatImageAttachmentError(
  error: ImageAttachmentError,
  copy: CustomConfig['forum']['publish']['feedbackForm'],
): string {
  const values = {
    filename: error.fileName,
    size: IMAGE_UPLOAD_POLICY.MAX_SIZE_LABEL,
    max: IMAGE_UPLOAD_POLICY.MAX_COUNT,
  }
  switch (error.code) {
    case 'count-exceeded': return formatMessage(copy.imageCountExceeded, values)
    case 'empty-file': return formatMessage(copy.imageEmpty, values)
    case 'invalid-type': return formatMessage(copy.imageInvalidType, values)
    case 'size-exceeded': return formatMessage(copy.imageTooLarge, values)
    case 'preview-failed': return formatMessage(copy.previewFailed, values)
    default: return copy.uploadFailed
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

export function publishTopic() {
  const currentHash = location.hash.slice(1)
  let targetHash = FORM_HASH

  if (location.hash && ['FEAT', 'BUG', 'ANN'].includes(currentHash)) {
    targetHash = `${targetHash}-${currentHash}`
  }

  location.hash = targetHash
}
