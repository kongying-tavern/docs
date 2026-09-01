import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { CustomConfig } from '../../.vitepress/locales/types'
import type ForumAPI from '@/apis/forum/api'
import type { FORUM } from '~/components/forum/types'
import { computed, ref, toValue } from 'vue'
import { toast } from 'vue-sonner'
import { issues } from '@/apis/forum/gitee'
import { useForumPersonalState } from '~/composables/forum/useForumPersonalState'
import { useForumRoute } from '~/composables/useForumRoute'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicManager } from '~/composables/useTopicManager'
import { useTopicTagsEditor } from './useTopicTagsEditor'

// @unocss-include
export function defineTopicDropdownMenu(topicData: MaybeRefOrGetter<ForumAPI.Topic>, message: Ref<CustomConfig>): ComputedRef<FORUM.TopicDropdownMenu[]> {
  const currentTopic = computed(() => toValue(topicData))
  const { toggleCloseTopic, toggleHideTopic, togglePinnedTopic, toggleTopicType, toggleTopicCommentArea } = useTopicManager(currentTopic, message)
  const { route, leaveTopic } = useForumRoute()
  const { hasAnyPermissions } = useRuleChecks(() => currentTopic.value.user.id)
  const personal = useForumPersonalState()

  const [closeState, toggleClose] = toggleCloseTopic()
  const [hideState, toggleHide] = toggleHideTopic()

  const { openTopicTagsEditorDialog } = useTopicTagsEditor()

  const menuLabels = ref(message.value.forum.topic.menu)

  const hasManagePermission = hasAnyPermissions('manage_feedback')
  const hasEditPermission = hasAnyPermissions('edit_feedback')
  const topicTypeEnum: ForumAPI.FeedbackTopicType[] = ['FEAT', 'BUG', 'ANN']

  const openOnGitee = () => issues.openTopicOnGitee(currentTopic.value.id)

  async function handleToggleCloseTopic() {
    const result = await toggleClose()
    if (result && result.state === 'closed' && route.value?.name === 'topic' && route.value.topicId === String(result.id))
      await leaveTopic()
  }

  async function handleToggleHideTopic() {
    const result = await toggleHide()
    if (result && result.state === 'progressing' && route.value?.name === 'topic' && route.value.topicId === String(result.id))
      await leaveTopic()
  }

  async function handleToggleFollow() {
    const wasFollowing = personal.isFollowing(currentTopic.value.id)
    try {
      await personal.toggleFollow(currentTopic.value)
      if (personal.isFollowing(currentTopic.value.id) === wasFollowing)
        toast.error(message.value.forum.errors.followFailed)
    }
    catch {
      toast.error(message.value.forum.errors.followFailed)
    }
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
      {
        type: 'item',
        id: 'follow-topic',
        order: 3,
        label: personal.isFollowing(currentTopic.value.id)
          ? message.value.forum.labels.unfollow
          : message.value.forum.labels.follow,
        icon: personal.isFollowing(currentTopic.value.id) ? 'i-lucide:bookmark-minus' : 'i-lucide:bookmark',
        disabled: personal.saving.value,
        action: handleToggleFollow,
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
        label: menuLabels.value.changeType.text,
        icon: 'i-lucide:settings',
        items: topicTypeEnum.filter(val => val !== currentTopic.value.type).map(
          val => ({
            id: `change-topic-${val}`,
            type: 'item',
            label: `${menuLabels.value.changeType.to} ${message.value.forum.topic.type[val.toLowerCase() as keyof typeof message.value.forum.topic.type] || val}`,
            action: () => toggleTopicType(val),
          }),
        ),
      },
      {
        id: 'tags-topic',
        type: 'item',
        label: menuLabels.value.modifyTags.text,
        icon: 'i-lucide-tags',
        action: () => openTopicTagsEditorDialog(currentTopic.value),
      },
      {
        id: 'pinned-topic',
        type: 'item',
        label: currentTopic.value.pinned ? menuLabels.value.pinTopic.unpin : menuLabels.value.pinTopic.pin,
        icon: currentTopic.value.pinned ? 'i-lucide:pin-off' : 'i-lucide:pin',
        action: togglePinnedTopic,
      },
      {
        id: 'close-comment-topic',
        type: 'item',
        label: currentTopic.value.commentCount === -1 ? menuLabels.value.commentArea.open : menuLabels.value.commentArea.close,
        icon: currentTopic.value.commentCount === -1 ? 'i-lucide:message-circle' : 'i-lucide:message-circle-off',
        action: toggleTopicCommentArea,
      },
      {
        id: 'hide-topic',
        type: 'item',
        label: hideState ? menuLabels.value.hideFeedback.text : menuLabels.value.cancelTopic.text,
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
        label: closeState.value ? menuLabels.value.reopenFeedback.text : menuLabels.value.closeFeedback.text,
        icon: closeState.value ? 'i-lucide:lock-open' : 'i-lucide:lock',
        action: handleToggleCloseTopic,
        class: closeState.value ? undefined : 'c-red opacity-90 hover:c-red hover:opacity-100',
      },
    ]
  })

  return computed(() => [
    ...noAnyPermissionItems.value,
    ...needManagePermissionItems.value,
    ...needEditPermissionItems.value,
  ])
}
