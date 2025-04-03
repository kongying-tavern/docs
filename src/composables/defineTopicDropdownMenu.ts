import type ForumAPI from '@/apis/forum/api'
import type { ComputedRef, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type { FORUM } from '~/components/forum/types'
import { issues } from '@/apis/forum/gitee'
import { computed, ref } from 'vue'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicManger } from '~/composables/useTopicManger'
import { useForumData } from '~/stores/useForumData'
import { useTopicTagsEditor } from './useTopicTagsEditor'

// @unocss-include
export function defineTopicDropdownMenu(topicData: ForumAPI.Topic, message: Ref<CustomConfig>): ComputedRef<FORUM.TopicDropdownMenu[]> {
  if (!topicData)
    return computed(() => [])

  const { removeTopic } = useForumData()

  const { toggleCloseTopic, toggleHideTopic, togglePinedTopic, toggleTopicType, toggleTopicCommentArea } = useTopicManger(topicData, message)
  const { hasAnyPermissions } = useRuleChecks(topicData.user.id)

  const [closeState, toggleClose] = toggleCloseTopic()
  const [hideState, toggleHide] = toggleHideTopic()

  const { openTopicTagsEditorDialog } = useTopicTagsEditor()

  const menuLabels = ref(message.value.forum.topic.menu)

  const hasManagePermission = hasAnyPermissions('manage_feedback')
  const hasEditPermission = hasAnyPermissions('edit_feedback')
  const topicTypeEnum: Exclude<ForumAPI.TopicType, null>[] = ['FEAT', 'BUG', 'ANN'] as const

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
    ].filter(Boolean) as FORUM.TopicDropdownMenu[]
  })

  const needManagePermissionItems = computed<FORUM.TopicDropdownMenu[]>(() => {
    if (!hasManagePermission.value)
      return []

    return [
      {
        type: 'separator',
      },
      {
        type: 'submenu',
        label: '更改类型',
        icon: 'i-lucide:settings',
        items: topicTypeEnum.filter(val => val !== topicData.type).map(
          val => ({
            id: `change-topic-${val}`,
            type: 'item',
            label: val,
            action: () => toggleTopicType(val),
          }),
        ),
      },
      {
        id: 'tags-topic',
        type: 'item',
        label: '修改 Tags',
        icon: 'i-lucide-tags',
        action: () => openTopicTagsEditorDialog(topicData),
      },
      {
        id: 'pinned-topic',
        type: 'item',
        label: topicData.pinned ? '取消固定' : '固定话题',
        icon: topicData.pinned ? 'i-lucide:pin-off' : 'i-lucide:pin',
        action: togglePinedTopic,
      },
      {
        id: 'close-comment-topic',
        type: 'item',
        label: topicData.commentCount === -1 ? '打开评论' : '关闭评论',
        icon: topicData.commentCount === -1 ? 'i-lucide:message-circle' : 'i-lucide:message-circle-off',
        action: toggleTopicCommentArea,
      },
      {
        id: 'hide-topic',
        type: 'item',
        label: hideState ? menuLabels.value.hideFeedback.text : '取消话题',
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
