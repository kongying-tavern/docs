import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef } from 'vue'
import type { FORUM } from '~/components/forum/types'
import { issues } from '@/apis/forum/gitee'
import { useLocalized } from '@/hooks/useLocalized'
import { useClipboard } from '@vueuse/core'

import { computed, ref } from 'vue'
import { getRedirectUrlText } from '~/composables/sessionCacheRedirect'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicManger } from '~/composables/useTopicManger'
import { useForumData } from '~/stores/useForumData'

// @unocss-include
export function defineTopicDropdownMenu(topicData?: ForumAPI.Topic): ComputedRef<FORUM.TopicDropdownMenu[]> {
  if (!topicData)
    return computed(() => [])

  const { message } = useLocalized()

  const { removeTopic } = useForumData()

  const { toggleCloseTopic, toggleHideTopic } = useTopicManger(topicData)
  const { hasAnyPermissions } = useRuleChecks(topicData.user.id)

  const [closeState, toggleClose] = toggleCloseTopic()
  const [hideState, toggleHide] = toggleHideTopic()

  const { copy, copied, isSupported: isCopySupported } = useClipboard()

  const menuLabels = ref(message.value.forum.topic.menu)

  const hasManagePermission = hasAnyPermissions('manage_feedback')
  const hasEditPermission = hasAnyPermissions('edit_feedback')

  const openOnGitee = () => issues.openTopicOnGitee(topicData.id)

  function handleToggleCloseTopic() {
    toggleClose()

    if (closeState && topicData)
      removeTopic(topicData.id)
  }

  function handleToggleHideTopic() {
    toggleHide()

    if (hideState && topicData)
      removeTopic(topicData.id)
  }

  const noAnyPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    return [
      {
        type: 'item',
        id: 'gitee-link',
        order: 1,
        label: menuLabels.value.giteeLink,
        icon: 'i-lucide:cable',
        action: openOnGitee,
      },
      isCopySupported.value
        ? {
            type: 'item',
            id: 'copy-link',
            label: copied.value ? menuLabels.value.copyLink.success : menuLabels.value.copyLink.text,
            icon: 'i-lucide:link',
            action: async () => {
              await copy(getRedirectUrlText(topicData.id, undefined, false))
            },
          }
        : null,
    ].filter(Boolean) as FORUM.TopicDropdownMenu[]
  })

  const needManagePermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasManagePermission.value)
      return []

    return [
      {
        id: 'hide-feedback',
        type: 'item',
        label: hideState ? menuLabels.value.hideFeedback.text : '取消隐藏',
        icon: hideState ? 'i-lucide:eye-off' : 'i-lucide:eye',
        action: handleToggleHideTopic,
      },
    ]
  })

  const needEditPermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasEditPermission.value)
      return []

    return [
      {
        type: 'separator',
      },
      {
        type: 'item',
        id: 'close-feedback',
        label: closeState ? menuLabels.value.closeFeedback.text : '打开反馈',
        icon: closeState ? 'i-lucide:square-x' : 'i-lucide:undo',
        action: handleToggleCloseTopic,
        class: 'c-red opacity-90 hover:c-red hover:opacity-100',
      },
    ]
  })

  return computed(() => [
    ...noAnyPermissionItems.value,
    ...needManagePermissionItems.value,
    ...needEditPermissionItems.value,
  ])
}
