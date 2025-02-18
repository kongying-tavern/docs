<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <slot name="trigger">
          <span class="i-custom-ellipsis-vertical icon-btn"></span>
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent :side="side" class="text-nowrap w-max">
      <slot name="menu" />

      <DropdownMenuItem v-if="hasManagePermission" @click="openGiteeLink">
        <span class="i-lucide:arrow-up-from-line icon-btn mr-2"></span>
        <span>{{ menuLabels.giteeLink }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="isSupported"
        @click="copy(getRedirectUrlText(topicData.user.id, undefined, false))"
      >
        <span class="i-lucide:link icon-btn mr-2"></span>
        <span v-if="!copied">{{ menuLabels.copyLink.text }}</span>
        <span v-else>{{ menuLabels.copyLink.success }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="hasManagePermission"
        @click="handleToggleHideTopic"
      >
        <span v-if="!hideState" class="i-lucide:eye-off icon-btn mr-2"></span>
        <span v-else class="i-lucide:eye icon-btn mr-2"></span>
        <span>{{ hideState ? '取消隐藏' : menuLabels.hideFeedback.text }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="hasEditPermission" />
      <DropdownMenuItem
        class="c-red opacity-90 hover:c-red hover:opacity-100"
        v-if="hasEditPermission"
        @click="handleToggleCloseTopic"
      >
        <span v-if="!closeState" class="i-lucide:square-x icon-btn mr-2"></span>
        <span v-else class="i-lucide:undo icon-btn mr-2"></span>
        <span>{{
          closeState ? '打开反馈' : menuLabels.closeFeedback.text
        }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { ref, type HTMLAttributes } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useClipboard } from '@vueuse/core'
import { getRedirectUrlText } from '~/composables/sessionCacheRedirect'
import { useTopicMannger } from '~/composables/useTopicMannger'
import { cn } from '@/lib/utils'

import type { DropdownMenuContentProps } from 'radix-vue'
import type ForumAPI from '@/apis/forum/api'

const { topicData, side = 'top' } = defineProps<
  {
    topicData: ForumAPI.Topic
    class?: HTMLAttributes['class']
  } & DropdownMenuContentProps
>()

defineOptions({
  inheritAttrs: false,
})

const emit = defineEmits([
  'topic:close',
  'topic:open',
  'topic:hide',
  'topic:show',
])

const { message } = useLocalized()
const { toggleCloseTopic, toggleHideTopic } = useTopicMannger(topicData)

const [closeState, toggleClose] = toggleCloseTopic()
const [hideState, toggleHide] = toggleHideTopic()

const { copy, copied, isSupported } = useClipboard()
const { hasAnyPermissions } = useRuleChecks(topicData.user.id)

const hasManagePermission = hasAnyPermissions('manage_feedback')
const hasEditPermission = hasAnyPermissions('edit_feedback')

const menuLabels = ref(message.value.forum.topic.menu)

const openGiteeLink = () => issues.openTopicOnGitee(topicData.id)

const handleToggleCloseTopic = () => {
  toggleClose()

  if (closeState) {
    emit('topic:close')
  } else {
    emit('topic:open')
  }
}

const handleToggleHideTopic = () => {
  toggleHide()

  if (hideState) {
    emit('topic:hide')
  } else {
    emit('topic:open')
  }
}
</script>
