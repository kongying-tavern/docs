<script setup lang="ts">
import type ForumAPI from '@/apis/forum/api'
import type { DropdownMenuContentProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { issues } from '@/apis/forum/gitee'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLocalized } from '@/hooks/useLocalized'
import { cn } from '@/lib/utils'
import { useClipboard } from '@vueuse/core'
import { ref } from 'vue'

import { getRedirectUrlText } from '~/composables/sessionCacheRedirect'
import { useRuleChecks } from '~/composables/useRuleChecks'
import { useTopicMannger } from '~/composables/useTopicMannger'

defineOptions({
  inheritAttrs: false,
})

const { topicData, side = 'top' } = defineProps<
  {
    topicData: ForumAPI.Topic
    class?: HTMLAttributes['class']
  } & DropdownMenuContentProps
>()

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

function handleToggleCloseTopic() {
  toggleClose()

  if (closeState) {
    emit('topic:close')
  }
  else {
    emit('topic:open')
  }
}

function handleToggleHideTopic() {
  toggleHide()

  if (hideState) {
    emit('topic:hide')
  }
  else {
    emit('topic:open')
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon"
        :class="cn('topic-btn-more align-mid h-auto', $props.class)"
      >
        <slot name="trigger">
          <span class="i-custom-ellipsis-vertical icon-btn" />
        </slot>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent :side="side" class="w-max text-nowrap">
      <slot name="menu" />

      <DropdownMenuItem v-if="hasManagePermission" @click="openGiteeLink">
        <span class="i-lucide:arrow-up-from-line mr-2 icon-btn" />
        <span>{{ menuLabels.giteeLink }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="isSupported"
        @click="copy(getRedirectUrlText(topicData.id, undefined, false))"
      >
        <span class="i-lucide:link mr-2 icon-btn" />
        <span v-if="!copied">{{ menuLabels.copyLink.text }}</span>
        <span v-else>{{ menuLabels.copyLink.success }}</span>
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if="hasManagePermission"
        @click="handleToggleHideTopic"
      >
        <span v-if="!hideState" class="i-lucide:eye-off mr-2 icon-btn" />
        <span v-else class="i-lucide:eye mr-2 icon-btn" />
        <span>{{ hideState ? '取消隐藏' : menuLabels.hideFeedback.text }}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator v-if="hasEditPermission" />
      <DropdownMenuItem
        v-if="hasEditPermission"
        class="c-red opacity-90 hover:c-red hover:opacity-100"
        @click="handleToggleCloseTopic"
      >
        <span v-if="!closeState" class="i-lucide:square-x mr-2 icon-btn" />
        <span v-else class="i-lucide:undo mr-2 icon-btn" />
        <span>{{
          closeState ? '打开反馈' : menuLabels.closeFeedback.text
        }}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
